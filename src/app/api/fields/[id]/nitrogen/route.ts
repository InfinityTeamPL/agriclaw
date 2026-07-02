// GET /api/fields/[id]/nitrogen — kalkulator dawki azotu per pole
// Łączy BBCH stage + ostatni NDRE z Sentinel-2 + powierzchnię → kg N/ha + zł.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { deriveBbchStatus, defaultSowingDate, type Crop } from '@/lib/bbch';
import { calculateNitrogen, buildSeasonalNitrogenPlan } from '@/lib/nitrogen';
import { fetchWithTimeout } from '@/lib/satellite/http';

const OPEN_METEO_HISTORY = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  // 1. Pole + crop + area + lat/lon
  const rows = await prisma.$queryRaw<
    Array<{ id: string; name: string; crop: string; area: number; lat: number; lon: number }>
  >`
    SELECT f.id, f.name, f.crop, f.area_hectares AS area,
           ST_Y(ST_Centroid(f.polygon)) AS lat,
           ST_X(ST_Centroid(f.polygon)) AS lon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.id} AND fa.user_id = ${user.id}
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const crop = field.crop as Crop;

  // 2. Ostatnie NDRE z bazy (z NdviReading)
  const latestReading = await prisma.ndviReading.findFirst({
    where: { fieldId: field.id },
    orderBy: { observedAt: 'desc' },
    select: { ndreMean: true, observedAt: true },
  });
  const ndre = latestReading?.ndreMean ?? null;

  // 3. Oblicz BBCH
  const sowingDate = defaultSowingDate(crop, new Date().getFullYear());
  const today = new Date().toISOString().slice(0, 10);
  const sowingStr = sowingDate.toISOString().slice(0, 10);
  const dailyTemps: Array<{ date: string; tMax: number; tMin: number }> = [];

  try {
    const histUrl = `${OPEN_METEO_HISTORY}?latitude=${field.lat}&longitude=${field.lon}&start_date=${sowingStr}&end_date=${today}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetchWithTimeout(histUrl, { timeoutMs: 15_000, retries: 1 });
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          dailyTemps.push({
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

  try {
    const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${field.lat}&longitude=${field.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3&past_days=3`;
    const res = await fetchWithTimeout(forecastUrl, { timeoutMs: 15_000, retries: 1 });
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          const date = data.daily.time[i];
          if (dailyTemps.find((d) => d.date === date)) continue;
          dailyTemps.push({
            date,
            tMax: data.daily.temperature_2m_max[i] ?? 0,
            tMin: data.daily.temperature_2m_min[i] ?? 0,
          });
        }
      }
    }
  } catch {
    // fall through
  }

  const bbchStatus = deriveBbchStatus({ crop, sowingDate, dailyTemps });
  if (!bbchStatus) {
    return NextResponse.json(
      { error: `Brak modelu BBCH dla uprawy ${crop}` },
      { status: 400 },
    );
  }

  // 4. Oblicz rekomendację N
  const recommendation = calculateNitrogen({
    crop,
    bbch: bbchStatus.currentBbch,
    areaHectares: field.area,
    ndre,
  });

  if (!recommendation) {
    return NextResponse.json(
      { error: `Brak profilu nawożeniowego dla uprawy ${crop}` },
      { status: 400 },
    );
  }

  // Plan sezonowy N1/N2/N3 + zgodność z Programem azotanowym (ARiMR)
  const seasonPlan = buildSeasonalNitrogenPlan(crop, field.area);

  return NextResponse.json({
    fieldId: field.id,
    fieldName: field.name,
    crop,
    bbch: bbchStatus.currentBbch,
    bbchLabel: bbchStatus.currentLabel,
    areaHectares: field.area,
    lastNdreObservedAt: latestReading?.observedAt ?? null,
    recommendation,
    seasonPlan,
  });
}
