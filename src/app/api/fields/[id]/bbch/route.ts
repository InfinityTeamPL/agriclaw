// GET /api/fields/[id]/bbch — aktualna faza BBCH + alerty agronomiczne.
// Fetches 90-365 dni pogody z Open-Meteo (historyczne + prognoza),
// liczy GDD od daty siewu, zwraca BBCH + następny milestone + dni do niego.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { deriveBbchStatus, defaultSowingDate, type Crop } from '@/lib/bbch';

const OPEN_METEO_HISTORY = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  const rows = await prisma.$queryRaw<
    Array<{ id: string; crop: string; lat: number; lon: number; sowing_date: Date | null }>
  >`
    SELECT f.id, f.crop,
           ST_Y(ST_Centroid(f.polygon)) AS lat,
           ST_X(ST_Centroid(f.polygon)) AS lon,
           NULL::timestamp AS sowing_date
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.id} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const crop = field.crop as Crop;
  const currentYear = new Date().getFullYear();
  const sowingDate = field.sowing_date
    ? new Date(field.sowing_date)
    : defaultSowingDate(crop, currentYear);

  // Pobierz historyczne + prognozę (od siewu do dziś + 7 dni prognozy)
  const today = new Date().toISOString().slice(0, 10);
  const sowingStr = sowingDate.toISOString().slice(0, 10);

  // Historical API: archive-api (do 2 dni wstecz od dzisiaj). Dla ozimej pszenicy
  // może sięgać 6+ miesięcy wstecz — archive API obsługuje do 1940.
  const daysBack = Math.ceil(
    (Date.now() - sowingDate.getTime()) / 86_400_000,
  );

  const dailyTemps: Array<{ date: string; tMax: number; tMin: number }> = [];

  if (daysBack > 3) {
    // Użyj historical archive
    const histUrl = `${OPEN_METEO_HISTORY}?latitude=${field.lat}&longitude=${field.lon}&start_date=${sowingStr}&end_date=${today}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    try {
      const res = await fetch(histUrl);
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
      // fallback do prognozy
    }
  }

  // Prognoza 7 dni do przodu (+ uzupełnienie ostatnich 2 dni których archive nie ma)
  try {
    const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${field.lat}&longitude=${field.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7&past_days=3`;
    const res = await fetch(forecastUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          const date = data.daily.time[i];
          // dedupe (archive + forecast mogą się zazębiać)
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
    // ok
  }

  if (dailyTemps.length === 0) {
    return NextResponse.json(
      { error: 'Nie udało się pobrać danych temperatury' },
      { status: 502 },
    );
  }

  const status = deriveBbchStatus({ crop, sowingDate, dailyTemps });
  if (!status) {
    return NextResponse.json(
      { error: `Brak modelu BBCH dla uprawy ${crop}` },
      { status: 400 },
    );
  }

  return NextResponse.json({
    fieldId: field.id,
    crop,
    sowingDate: sowingDate.toISOString(),
    sowingDateIsEstimate: field.sowing_date === null,
    daysSinceSowing: Math.round((Date.now() - sowingDate.getTime()) / 86_400_000),
    status,
  });
}
