import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';
import { fetchWeatherForecast } from '@/lib/satellite/weather';

export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const fieldId = req.nextUrl.searchParams.get('field_id');
  const daysStr = req.nextUrl.searchParams.get('days') ?? '7';
  const days = Math.min(Math.max(parseInt(daysStr, 10) || 7, 1), 14);

  let lat: number;
  let lon: number;

  if (fieldId) {
    const rows = await prisma.$queryRaw<Array<{ lat: number; lon: number }>>`
      SELECT ST_Y(ST_Centroid(polygon)) AS lat, ST_X(ST_Centroid(polygon)) AS lon
      FROM "fields"
      WHERE id = ${fieldId} AND farm_id = ${auth.farmId} AND deleted_at IS NULL
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    lat = rows[0].lat;
    lon = rows[0].lon;
  } else {
    // Bez field_id → użyj centroidu farmy
    const farm = await prisma.farm.findUnique({ where: { id: auth.farmId } });
    if (!farm) return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    lat = farm.lat;
    lon = farm.lon;
  }

  const summary = await fetchWeatherForecast(lat, lon, days);

  return NextResponse.json({
    location: { lat, lon },
    days_without_rain: summary.daysWithoutRain,
    total_precip_next_7: Number(summary.totalPrecipNext7.toFixed(1)),
    avg_et0_next_7: Number(summary.avgEt0Next7.toFixed(2)),
    drought_risk: summary.droughtRiskLevel,
    daily: summary.daily.dates.slice(0, days).map((date, i) => ({
      date,
      temp_max: summary.daily.tempMax[i],
      temp_min: summary.daily.tempMin[i],
      precipitation_mm: summary.daily.precipitation[i],
      et0_mm: summary.daily.et0[i],
      soil_moisture_shallow: summary.daily.soilMoistureShallow[i] ?? null,
      wind_max_kmh: summary.daily.windMaxKmh[i],
    })),
  });
}
