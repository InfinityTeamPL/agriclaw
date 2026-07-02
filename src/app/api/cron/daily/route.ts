// Codzienny cron — 4:00 UTC (6:00 PL) przez Vercel Cron.
// Dla każdego pola pobiera świeży NDVI + pogodę, generuje rekomendację,
// i jeśli severity >= medium — wysyła WhatsApp do rolnika.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractNdviValues } from '@/lib/satellite/copernicus';
import { computeNdviStats } from '@/lib/satellite/ndvi';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';
import { fetchWeatherForecast } from '@/lib/satellite/weather';
import { generateRecommendation } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  // Autoryzacja WYŁĄCZNIE przez Bearer CRON_SECRET. Vercel Cron pozwala ustawić
  // nagłówek Authorization w konfiguracji crona. NIE ufamy samej obecności
  // nagłówka x-vercel-cron — nie jest sekretem i da się go podrobić (audyt: bypass).
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Bez credentiali CDSE cron nie ma jak pobrać NDVI — nie wywalaj całości 500,
  // zwróć kontrolowany raport (patrz audyt: cron 500 przy braku creds).
  if (!isCopernicusConfigured()) {
    return NextResponse.json(
      { error: 'CDSE not configured', skipped: true, reason: 'Brak CDSE_CLIENT_ID/SECRET' },
      { status: 503 },
    );
  }

  const results = {
    fields_processed: 0,
    fields_failed: 0,
    fields_skipped_no_imagery: 0,
    alerts_queued: 0,
    started_at: new Date().toISOString(),
  };

  const fields = await prisma.$queryRaw<
    Array<{
      id: string;
      farm_id: string;
      crop: string;
      polygon: string;
      centroid_lat: number;
      centroid_lon: number;
    }>
  >`
    SELECT f.id, f.farm_id, f.crop,
           ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_Y(ST_Centroid(f.polygon)) AS centroid_lat,
           ST_X(ST_Centroid(f.polygon)) AS centroid_lon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.suspended = FALSE
  `;

  const cdse = getCopernicusClient();
  const today = new Date().toISOString().slice(0, 10);
  const fortnightAgo = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);

  for (const field of fields) {
    try {
      const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
      const [tiff, weather] = await Promise.all([
        cdse.fetchNdviGeotiff(polygon, fortnightAgo, today),
        fetchWeatherForecast(field.centroid_lat, field.centroid_lon, 7),
      ]);

      const values = await extractNdviValues(tiff);
      const stats = computeNdviStats(values);

      // Brak bezchmurnych pikseli (po masce SCL raster to same NaN → validCount 0,
      // mean 0). NIE zapisujemy "0" jako pomiaru — zatruwałby trend i wywołał
      // fałszywy alarm suszowy (NDVI < 0.35). Log event i pomiń pole. Audyt 2.8.
      if (stats.validCount === 0) {
        results.fields_skipped_no_imagery++;
        await prisma.event.create({
          data: {
            farmId: field.farm_id,
            type: 'ndvi.no_clear_imagery',
            title: 'Brak bezchmurnego zdjęcia (14 dni)',
            detail: `Pole ${field.id}: brak bezchmurnej sceny Sentinel-2 w oknie 14 dni — pominięto odczyt NDVI.`,
          },
        });
        continue;
      }

      const prev = await prisma.ndviReading.findFirst({
        where: { fieldId: field.id, source: { not: 'mock' } },
        orderBy: { observedAt: 'desc' },
      });

      await prisma.ndviReading.create({
        data: {
          fieldId: field.id,
          observedAt: new Date(),
          ndviMean: stats.mean,
          ndviMin: stats.min,
          ndviMax: stats.max,
          validCount: stats.validCount,
          cloudCover: 0,
          source: 'sentinel-2',
        },
      });

      const rec = generateRecommendation({
        crop: field.crop,
        ndviMean: stats.mean,
        ndviPrevious: prev?.ndviMean,
        daysWithoutRain: weather.daysWithoutRain,
        avgEt0Next7: weather.avgEt0Next7,
        monthOfYear: new Date().getMonth() + 1,
      });

      if (rec.severity !== 'none') {
        await prisma.recommendation.create({
          data: {
            fieldId: field.id,
            severity: rec.severity,
            title: rec.title,
            message: rec.message,
            action: rec.action,
          },
        });

        if (rec.severity === 'medium' || rec.severity === 'high') {
          await prisma.event.create({
            data: {
              farmId: field.farm_id,
              type: 'alert.queued',
              title: `[${rec.severity.toUpperCase()}] ${rec.title}`,
              detail: `${rec.message}\n\n${rec.action}`,
            },
          });
          results.alerts_queued++;
        }
      }

      results.fields_processed++;
    } catch (err) {
      results.fields_failed++;
      console.error(`Cron daily: pole ${field.id} — błąd:`, err);
      await prisma.event.create({
        data: {
          farmId: field.farm_id,
          type: 'cron.error',
          title: 'Błąd dziennej analizy',
          detail: String(err),
        },
      });
    }
  }

  return NextResponse.json({
    ...results,
    finished_at: new Date().toISOString(),
  });
}
