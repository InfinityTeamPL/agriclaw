// GET /api/fields/[id]/frost — ryzyko przymrozków na najbliższe 10 dni.
// Łączy prognozę Open-Meteo min temp + BBCH stage + progi uszkodzeń per uprawa.
// Jeśli wykryto warning/critical, tworzy Recommendation w DB dla WhatsApp cron.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { deriveBbchStatus, defaultSowingDate, type Crop } from '@/lib/bbch';
import { assessFrostRisk } from '@/lib/frost';

const OPEN_METEO_HISTORY = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

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
  const currentYear = new Date().getFullYear();
  const sowingDate = defaultSowingDate(crop, currentYear);

  // 1. Pobierz historyczne temperatury od siewu (dla GDD → BBCH)
  const today = new Date().toISOString().slice(0, 10);
  const sowingStr = sowingDate.toISOString().slice(0, 10);
  const dailyTemps: Array<{ date: string; tMax: number; tMin: number }> = [];
  try {
    const histUrl = `${OPEN_METEO_HISTORY}?latitude=${field.lat}&longitude=${field.lon}&start_date=${sowingStr}&end_date=${today}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
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
    // fall through
  }

  // 2. Pobierz prognozę 10 dni + uzupełnij dailyTemps ostatnimi 3 dniami
  const forecastNights: Array<{ date: string; tMin: number }> = [];
  try {
    const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${field.lat}&longitude=${field.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10&past_days=3`;
    const res = await fetch(forecastUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      if (data.daily) {
        const nowStr = today;
        for (let i = 0; i < data.daily.time.length; i++) {
          const date = data.daily.time[i];
          const tMax = data.daily.temperature_2m_max[i] ?? 0;
          const tMin = data.daily.temperature_2m_min[i] ?? 0;
          if (!dailyTemps.find((d) => d.date === date)) {
            dailyTemps.push({ date, tMax, tMin });
          }
          // Tylko przyszłe noce do frost assessment (dzisiaj + 10)
          if (date >= nowStr) {
            forecastNights.push({ date, tMin });
          }
        }
      }
    }
  } catch {
    // fall through
  }

  if (forecastNights.length === 0) {
    return NextResponse.json(
      { error: 'Nie udało się pobrać prognozy temperatury' },
      { status: 502 },
    );
  }

  // 3. Oblicz BBCH (jeśli model istnieje dla uprawy)
  const bbchStatus = deriveBbchStatus({ crop, sowingDate, dailyTemps });
  const bbch = bbchStatus?.currentBbch ?? 0;

  // 4. Oceń ryzyko przymrozków
  const assessment = assessFrostRisk({ crop, bbch, forecast: forecastNights });

  // 5. Jeśli warning/critical → upsert Recommendation (dedup na tytule)
  if (assessment.shouldCreateRecommendation) {
    const severity = assessment.worstLevel === 'critical' ? 'high' : 'medium';
    const firstDanger = assessment.nights.find(
      (n) => n.level === 'warning' || n.level === 'critical',
    );
    const title = `Przymrozki — ${firstDanger
      ? new Date(firstDanger.date).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' })
      : 'najbliższe dni'}`;

    const existing = await prisma.recommendation.findFirst({
      where: {
        fieldId: field.id,
        title: { startsWith: 'Przymrozki' },
        createdAt: { gt: new Date(Date.now() - 24 * 3600_000) },
      },
    });

    if (!existing) {
      await prisma.recommendation.create({
        data: {
          fieldId: field.id,
          severity,
          title,
          message: `${assessment.thresholds.sensitivityPhase}. Minimum nocne ${assessment.minTempC.toFixed(1)}°C. Próg uszkodzeń: ${assessment.thresholds.damageThreshold}°C.`,
          action: assessment.recommendation,
        },
      });
    }
  }

  return NextResponse.json({
    fieldId: field.id,
    fieldName: field.name,
    crop,
    bbch,
    bbchLabel: bbchStatus?.currentLabel ?? 'nieznana',
    sensitivityPhase: assessment.thresholds.sensitivityPhase,
    damageThreshold: assessment.thresholds.damageThreshold,
    lethalThreshold: assessment.thresholds.lethalThreshold,
    worstLevel: assessment.worstLevel,
    minTempC: assessment.minTempC,
    firstDangerDate: assessment.firstDangerDate,
    nights: assessment.nights,
    recommendation: assessment.recommendation,
  });
}
