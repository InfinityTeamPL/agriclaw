import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';
import { fetchSmapSoilMoisture } from '@/lib/satellite/smap';

export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const fieldId = req.nextUrl.searchParams.get('field_id');
  if (!fieldId) return NextResponse.json({ error: 'field_id required' }, { status: 400 });

  const rows = await prisma.$queryRaw<
    Array<{ id: string; lat: number; lon: number; name: string }>
  >`
    SELECT id, name,
           ST_Y(ST_Centroid(polygon)) AS lat,
           ST_X(ST_Centroid(polygon)) AS lon
    FROM "fields"
    WHERE id = ${fieldId}::uuid AND farm_id = ${auth.farmId}::uuid
  `;

  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  // Cached: najnowszy reading z DB (z cron albo poprzedniej analizy)
  const cached = await prisma.soilMoistureReading.findFirst({
    where: { fieldId },
    orderBy: { observedAt: 'desc' },
  });

  // Stale? (> 7 dni) → pobierz świeżo
  const isStale = !cached || cached.observedAt < new Date(Date.now() - 7 * 864e5);

  if (!isStale && cached) {
    return NextResponse.json({
      field_id: fieldId,
      moisture_pct: cached.moisturePct,
      observed_at: cached.observedAt.toISOString(),
      source: cached.source,
      cached: true,
    });
  }

  const fresh = await fetchSmapSoilMoisture(field.lat, field.lon);
  if (!fresh) {
    return NextResponse.json({
      field_id: fieldId,
      status: 'unavailable',
      note: 'SMAP niedostępny (brak credentials lub brak danych w oknie 10 dni). Użyj Open-Meteo soil_moisture jako proxy.',
    });
  }

  await prisma.soilMoistureReading.create({
    data: {
      fieldId,
      observedAt: new Date(fresh.observedAt),
      moisturePct: fresh.moisturePct,
      source: fresh.source,
    },
  });

  return NextResponse.json({
    field_id: fieldId,
    moisture_pct: fresh.moisturePct,
    observed_at: fresh.observedAt,
    source: fresh.source,
    cached: false,
  });
}
