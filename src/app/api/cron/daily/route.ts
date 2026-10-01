// Codzienny cron — 4:00 UTC (6:00 PL) przez Vercel Cron.
// Dla każdego pola pobiera świeży NDVI + pogodę, generuje rekomendację,
// i jeśli severity >= medium — wysyła WhatsApp do rolnika.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCopernicusClient } from '@/lib/satellite/copernicus';
import { fetchLatestClearScene, TREND_WINDOW_DAYS } from '@/lib/satellite/scene';
import { cropStage } from '@/lib/satellite/ndvi';
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

  // Rejestr ŚOR: fire-and-forget. Idempotentne po id zasobów wydania, więc
  // codzienne odpalenie kosztuje 1 zapytanie listy + 1 SELECT gdy brak zmian.
  // W dev wołamy funkcję bezpośrednio (brak CRON_SECRET → HTTP dałby ciche 401).
  if (process.env.NODE_ENV === 'development') {
    waitUntil(
      import('@/lib/sor-registry')
        .then((m) => m.syncSorRegistry())
        .then((r) => console.log('sor-sync (dev):', r.status))
        .catch((err) => console.error('sor-sync (dev):', err)),
    );
  } else {
    // Publiczna domena (NEXTAUTH_URL) — VERCEL_URL jest za Deployment Protection.
    const origin = process.env.NEXTAUTH_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    waitUntil(
      fetch(`${origin}/api/cron/sor-sync`, {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
      })
        .then((res) => {
          // fetch nie odrzuca na 4xx/5xx — trwała misconfiguracja (401/404) byłaby
          // niewidoczna bez tego logu (lekcja z PR #12: skaner "działał" na SSO).
          if (!res.ok) console.error('sor-sync trigger: HTTP', res.status);
        })
        .catch((err) => console.error('sor-sync trigger:', err)),
    );
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
    fields_deferred: 0,
    alerts_queued: 0,
    started_at: new Date().toISOString(),
  };

  const fields = await prisma.$queryRaw<
    Array<{
      id: string;
      farm_id: string;
      crop: string;
      sowing_date: Date | null;
      polygon: string;
      centroid_lat: number;
      centroid_lon: number;
    }>
  >`
    SELECT f.id, f.farm_id, f.crop, f.sowing_date,
           ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_Y(ST_Centroid(f.polygon)) AS centroid_lat,
           ST_X(ST_Centroid(f.polygon)) AS centroid_lon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.suspended = FALSE AND f.deleted_at IS NULL
  `;

  const cdse = getCopernicusClient();
  const today = new Date().toISOString().slice(0, 10);
  const fortnightAgo = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const month = new Date().getMonth() + 1;

  // Przetwarzanie równoległe w partiach + budżet czasu. Sekwencyjna pętla (CDSE
  // 5-20 s/pole) nie zeskalowałaby ponad ~20-30 pól przy maxDuration 300 s — reszta
  // ginęła bez analizy. Teraz partie po CONCURRENCY, a przy zbliżaniu się do deadline
  // przerywamy i raportujemy fields_deferred (dokończy kolejny cron). Audyt 2.9.
  const CONCURRENCY = 6;
  const deadline = Date.now() + 250_000;

  async function processField(field: (typeof fields)[number]): Promise<void> {
    try {
      const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
      const [scene, weather] = await Promise.all([
        // Najnowsza scena z widocznym polem (4 indeksy w jednym zapytaniu) + jej
        // PRAWDZIWA data przelotu. Wcześniej mozaika 14 dni z observedAt = now():
        // codziennie „nowy" odczyt tej samej sceny, a w UI godzina crona zamiast
        // daty zdjęcia (10.2026).
        fetchLatestClearScene(cdse, polygon, fortnightAgo, today),
        fetchWeatherForecast(field.centroid_lat, field.centroid_lon, 7),
      ]);

      // Same chmury nad polem — NIE zapisujemy "0" jako pomiaru (zatruwałby trend
      // i wywołał fałszywy alarm suszowy). Log event i pomiń pole. Audyt 2.8.
      if (!scene) {
        results.fields_skipped_no_imagery++;
        await prisma.event.create({
          data: {
            farmId: field.farm_id,
            type: 'ndvi.no_clear_imagery',
            title: 'Brak bezchmurnego zdjęcia (14 dni)',
            detail: `Pole ${field.id}: brak bezchmurnej sceny Sentinel-2 w oknie 14 dni — pominięto odczyt NDVI.`,
          },
        });
        return;
      }

      const { indices, sceneAt } = scene;
      const stats = indices.ndvi;

      // Trend tylko w obrębie sezonu i tylko wobec WCZEŚNIEJSZEJ sceny.
      const prev = await prisma.ndviReading.findFirst({
        where: {
          fieldId: field.id,
          source: { not: 'mock' },
          observedAt: { lt: sceneAt, gte: new Date(sceneAt.getTime() - TREND_WINDOW_DAYS * 864e5) },
        },
        orderBy: { observedAt: 'desc' },
      });

      // Scena już zapisana (brak nowego przelotu od wczoraj) → bez dubla w historii.
      const alreadyStored = await prisma.ndviReading.count({
        where: { fieldId: field.id, observedAt: sceneAt, source: 'sentinel-2' },
      });

      if (!alreadyStored) await prisma.ndviReading.create({
        data: {
          fieldId: field.id,
          observedAt: sceneAt,
          ndviMean: stats.mean,
          ndviMin: stats.min,
          ndviMax: stats.max,
          ndreMean: indices.ndre.mean,
          ndreMin: indices.ndre.min,
          ndreMax: indices.ndre.max,
          ndwiMean: indices.ndwi.mean,
          ndwiMin: indices.ndwi.min,
          ndwiMax: indices.ndwi.max,
          saviMean: indices.savi.mean,
          saviMin: indices.savi.min,
          saviMax: indices.savi.max,
          validCount: stats.validCount,
          cloudCover: scene.cloudCover,
          source: 'sentinel-2',
        },
      });

      const rec = generateRecommendation({
        crop: field.crop,
        ndviMean: stats.mean,
        ndviPrevious: prev?.ndviMean,
        daysWithoutRain: weather.daysWithoutRain,
        avgEt0Next7: weather.avgEt0Next7,
        monthOfYear: month,
        stage: cropStage(field.crop, { sowingDate: field.sowing_date, at: sceneAt }),
      });

      if (rec.severity !== 'none') {
        await prisma.recommendation.create({
          data: {
            fieldId: field.id,
            severity: rec.severity,
            title: rec.title,
            message: rec.message,
            action: rec.action,
            // Warstwa „dlaczego" — także dla sygnałów z porannego skanu.
            ruleId: rec.ruleId,
            why: rec.why as unknown as Prisma.InputJsonValue,
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
      await prisma.event
        .create({
          data: {
            farmId: field.farm_id,
            type: 'cron.error',
            title: 'Błąd dziennej analizy',
            detail: String(err),
          },
        })
        .catch(() => {});
    }
  }

  let launched = 0;
  for (let i = 0; i < fields.length; i += CONCURRENCY) {
    if (Date.now() > deadline) break;
    const chunk = fields.slice(i, i + CONCURRENCY);
    await Promise.allSettled(chunk.map(processField));
    launched += chunk.length;
  }
  results.fields_deferred = fields.length - launched;

  return NextResponse.json({
    ...results,
    finished_at: new Date().toISOString(),
  });
}
