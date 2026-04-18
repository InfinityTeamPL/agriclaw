// GET /api/fields/[id]/water-balance — bilans wodny pola FAO-56.
// Pobiera 21 dni historii (opady + ET0 z Open-Meteo archive) + 7 dni prognozy,
// oblicza Kc z BBCH i zwraca dzienny bilans + rekomendację nawodnienia.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { deriveBbchStatus, defaultSowingDate, type Crop } from '@/lib/bbch';
import { calculateWaterBalance } from '@/lib/water-balance';

const OPEN_METEO_HISTORY = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

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

  // Historia: 21 dni wstecz do 3 dni wstecz (archive kończy się 2-3 dni przed dziś).
  // Prognoza: past_days=3 + forecast_days=7 uzupełnia ostatnie 3 dni archiwum + 7 do przodu.
  const today = new Date();
  const start = new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10);
  const end = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);

  const days: Map<string, { rainMm: number; et0Mm: number }> = new Map();

  // 1. Historia
  try {
    const histUrl = `${OPEN_METEO_HISTORY}?latitude=${field.lat}&longitude=${field.lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum,et0_fao_evapotranspiration&timezone=auto`;
    const res = await fetch(histUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; precipitation_sum: number[]; et0_fao_evapotranspiration: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          days.set(data.daily.time[i], {
            rainMm: data.daily.precipitation_sum[i] ?? 0,
            et0Mm: data.daily.et0_fao_evapotranspiration[i] ?? 0,
          });
        }
      }
    }
  } catch {
    // fall through
  }

  // 2. Prognoza
  try {
    const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${field.lat}&longitude=${field.lon}&daily=precipitation_sum,et0_fao_evapotranspiration&timezone=auto&past_days=3&forecast_days=7`;
    const res = await fetch(forecastUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; precipitation_sum: number[]; et0_fao_evapotranspiration: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          const date = data.daily.time[i];
          // Forecast zastępuje archive w ostatnich 2-3 dniach (dokładniejsza wartość realtime).
          days.set(date, {
            rainMm: data.daily.precipitation_sum[i] ?? 0,
            et0Mm: data.daily.et0_fao_evapotranspiration[i] ?? 0,
          });
        }
      }
    }
  } catch {
    // fall through
  }

  // 3. BBCH
  const sowingDate = defaultSowingDate(crop, today.getFullYear());
  const sowingStr = sowingDate.toISOString().slice(0, 10);
  const tempDays: Array<{ date: string; tMax: number; tMin: number }> = [];
  try {
    const histTempUrl = `${OPEN_METEO_HISTORY}?latitude=${field.lat}&longitude=${field.lon}&start_date=${sowingStr}&end_date=${today.toISOString().slice(0, 10)}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(histTempUrl);
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

  // 4. Zamień mapę na posortowaną tablicę
  const dailyData = Array.from(days.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (dailyData.length === 0) {
    return NextResponse.json(
      { error: 'Nie udało się pobrać danych meteo' },
      { status: 502 },
    );
  }

  // 5. Bilans
  const balance = calculateWaterBalance({
    crop,
    bbch: bbchStatus?.currentBbch ?? 50, // default do kcMid jeśli brak BBCH
    areaHectares: field.area,
    days: dailyData,
  });

  return NextResponse.json({
    fieldId: field.id,
    fieldName: field.name,
    crop,
    bbch: bbchStatus?.currentBbch ?? null,
    bbchLabel: bbchStatus?.currentLabel ?? null,
    areaHectares: field.area,
    balance,
  });
}
