// Codzienny cron — 4:00 UTC (6:00 PL) przez Vercel Cron.
// Dla każdego pola pobiera świeży NDVI + pogodę, generuje rekomendację,
// i jeśli severity >= medium — wysyła WhatsApp do rolnika.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractNdviValues } from '@/lib/satellite/copernicus';
import { computeNdviStats } from '@/lib/satellite/ndvi';
import { fetchWeatherForecast } from '@/lib/satellite/weather';
import { generateRecommendation } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron podaje header x-vercel-cron-signature albo authorization Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = req.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;
  const vercelSig = req.headers.get('x-vercel-cron');
  if (vercelSig) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    fields_processed: 0,
    fields_failed: 0,
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

      const prev = await prisma.ndviReading.findFirst({
        where: { fieldId: field.id },
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
        },
      });

      const rec = generateRecommendation({
        crop: field.crop,
        ndviMean: stats.mean,
        ndviPrevious: prev?.ndviMean,
        daysWithoutRain: weather.daysWithoutRain,
        avgEt0Next7: weather.avgEt0Next7,
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
