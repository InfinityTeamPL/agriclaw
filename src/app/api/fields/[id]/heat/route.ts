// GET /api/fields/[id]/heat — ryzyko stresu cieplnego na najbliższe 10 dni.
// Komplement do /frost — >28-35°C zależnie od uprawy i BBCH.
// Kluczowe okna: kukurydza pylenie (>35°C), rzepak kwitnienie (>28°C), pszenica napełnianie (>32°C).

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { deriveBbchStatus, defaultSowingDate, type Crop } from '@/lib/bbch';
import { assessHeatStress } from '@/lib/heat-stress';

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
  const sowingDate = defaultSowingDate(crop, new Date().getFullYear());
  const sowingStr = sowingDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const dailyTemps: Array<{ date: string; tMax: number; tMin: number }> = [];

  // 1. Historia dla BBCH
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

  // 2. Prognoza 10 dni
  const forecastDays: Array<{ date: string; tMax: number }> = [];
  try {
    const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${field.lat}&longitude=${field.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10&past_days=3`;
    const res = await fetch(forecastUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          const date = data.daily.time[i];
          const tMax = data.daily.temperature_2m_max[i] ?? 0;
          const tMin = data.daily.temperature_2m_min[i] ?? 0;
          if (!dailyTemps.find((d) => d.date === date)) {
            dailyTemps.push({ date, tMax, tMin });
          }
          if (date >= today) {
            forecastDays.push({ date, tMax });
          }
        }
      }
    }
  } catch {
    // fall through
  }

  if (forecastDays.length === 0) {
    return NextResponse.json(
      { error: 'Nie udało się pobrać prognozy temperatury' },
      { status: 502 },
    );
  }

  const bbchStatus = deriveBbchStatus({ crop, sowingDate, dailyTemps });
  const bbch = bbchStatus?.currentBbch ?? 50;

  const assessment = assessHeatStress({ crop, bbch, forecast: forecastDays });

  if (assessment.shouldCreateRecommendation) {
    const severity = assessment.worstLevel === 'critical' ? 'high' : 'medium';
    const firstDanger = assessment.days.find(
      (d) => d.level === 'warning' || d.level === 'critical',
    );
    const title = `Stres cieplny — ${firstDanger
      ? new Date(firstDanger.date).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' })
      : 'najbliższe dni'}`;

    const existing = await prisma.recommendation.findFirst({
      where: {
        fieldId: field.id,
        title: { startsWith: 'Stres cieplny' },
        createdAt: { gt: new Date(Date.now() - 24 * 3600_000) },
      },
    });

    if (!existing) {
      await prisma.recommendation.create({
        data: {
          fieldId: field.id,
          severity,
          title,
          message: `${assessment.thresholds.sensitivityPhase}. Maksymalna temp ${assessment.maxTempC.toFixed(0)}°C. ${assessment.consecutiveStressDays >= 3 ? assessment.consecutiveStressDays + ' dni pod rząd. ' : ''}Próg stresu: ${assessment.thresholds.stressThreshold}°C.`,
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
    stressThreshold: assessment.thresholds.stressThreshold,
    criticalThreshold: assessment.thresholds.criticalThreshold,
    worstLevel: assessment.worstLevel,
    maxTempC: assessment.maxTempC,
    consecutiveStressDays: assessment.consecutiveStressDays,
    firstDangerDate: assessment.firstDangerDate,
    days: assessment.days,
    recommendation: assessment.recommendation,
  });
}
