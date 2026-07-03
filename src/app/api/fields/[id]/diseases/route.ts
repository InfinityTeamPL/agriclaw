// GET /api/fields/[id]/diseases — ryzyko chorób grzybowych na podstawie pogody + BBCH.
// Nie wymaga CDSE / Sentinel-2 — używa tylko Open-Meteo + ostatnie NDVI z bazy.
// Widget pokazuje aktualne ryzyka per choroba z akcją i oknem fungicydu.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { deriveBbchStatus, defaultSowingDate, type Crop } from '@/lib/bbch';
import { assessDiseaseRisks } from '@/lib/disease-models';
import { fetchSprayForecast, fetchWeatherForecast } from '@/lib/satellite/weather';

const OPEN_METEO_HISTORY = 'https://archive-api.open-meteo.com/v1/archive';

export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  const rows = await prisma.$queryRaw<
    Array<{ id: string; name: string; crop: string; lat: number; lon: number }>
  >`
    SELECT f.id, f.name, f.crop,
           ST_Y(ST_Centroid(f.polygon)) AS lat,
           ST_X(ST_Centroid(f.polygon)) AS lon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.id} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const crop = field.crop as Crop;

  // 1. Hourly + daily pogoda
  const [sprayForecast, weather] = await Promise.allSettled([
    fetchSprayForecast(field.lat, field.lon),
    fetchWeatherForecast(field.lat, field.lon, 7),
  ]);

  if (sprayForecast.status !== 'fulfilled' || weather.status !== 'fulfilled') {
    return NextResponse.json(
      { error: 'Pogoda niedostępna' },
      { status: 502 },
    );
  }

  // 2. BBCH
  const sowingDate = defaultSowingDate(crop, new Date().getFullYear());
  const tempDays: Array<{ date: string; tMax: number; tMin: number }> = [];
  try {
    const histUrl = `${OPEN_METEO_HISTORY}?latitude=${field.lat}&longitude=${field.lon}&start_date=${sowingDate.toISOString().slice(0, 10)}&end_date=${new Date().toISOString().slice(0, 10)}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(histUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          tempDays.push({
            date: data.daily.time[i],
            tMax: data.daily.temperature_2m_max[i] ?? 0,
            tMin: data.daily.temperature_2m_min[i] ?? 0,
          });
        }
      }
    }
  } catch {
    // fall through
  }
  const bbchStatus = deriveBbchStatus({ crop, sowingDate, dailyTemps: tempDays });

  // 3. Ostatni NDVI z bazy (do detekcji mączniaka na bujnym łanie)
  const latestReading = await prisma.ndviReading.findFirst({
    where: { fieldId: field.id },
    orderBy: { observedAt: 'desc' },
    select: { ndviMean: true, observedAt: true },
  });
  const ndviMean = latestReading?.ndviMean ?? 0.5; // default neutralny

  // 4. Ocena ryzyk
  const risks = assessDiseaseRisks({
    crop,
    hourly: sprayForecast.value.hourly,
    daily: weather.value.daily,
    ndviMean,
    bbchStage: bbchStatus?.currentBbch,
  });

  return NextResponse.json({
    fieldId: field.id,
    fieldName: field.name,
    crop,
    bbch: bbchStatus?.currentBbch ?? null,
    bbchLabel: bbchStatus?.currentLabel ?? null,
    ndviMean,
    ndviObservedAt: latestReading?.observedAt ?? null,
    risks,
  });
}
