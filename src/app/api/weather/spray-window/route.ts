// GET /api/weather/spray-window?fieldId=X — 72h forecast z scoringiem oprysku.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { fetchSprayForecast } from '@/lib/satellite/weather';

export async function GET(req: NextRequest) {
  const { user } = await requireAuth();
  const fieldId = req.nextUrl.searchParams.get('fieldId');

  let lat: number;
  let lon: number;

  if (fieldId) {
    const rows = await prisma.$queryRaw<Array<{ lat: number; lon: number }>>`
      SELECT ST_Y(ST_Centroid(f.polygon)) AS lat, ST_X(ST_Centroid(f.polygon)) AS lon
      FROM "fields" f
      JOIN "farms" fa ON fa.id = f.farm_id
      WHERE f.id = ${fieldId} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }
    lat = rows[0].lat;
    lon = rows[0].lon;
  } else {
    const farm = await prisma.farm.findFirst({ where: { userId: user.id } });
    if (!farm) return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    lat = farm.lat;
    lon = farm.lon;
  }

  try {
    const forecast = await fetchSprayForecast(lat, lon);
    return NextResponse.json(forecast);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
