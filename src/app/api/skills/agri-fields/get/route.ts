import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';

export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const fieldId = req.nextUrl.searchParams.get('field_id');
  if (!fieldId) {
    return NextResponse.json({ error: 'field_id required' }, { status: 400 });
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      crop: string;
      area_hectares: number;
      centroid_lat: number;
      centroid_lon: number;
      created_at: Date;
    }>
  >`
    SELECT id, name, crop, area_hectares, created_at,
           ST_Y(ST_Centroid(polygon)) AS centroid_lat,
           ST_X(ST_Centroid(polygon)) AS centroid_lon
    FROM "fields"
    WHERE id = ${fieldId} AND farm_id = ${auth.farmId}
  `;

  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  const lastReading = await prisma.ndviReading.findFirst({
    where: { fieldId: field.id },
    orderBy: { observedAt: 'desc' },
  });

  const lastRec = await prisma.recommendation.findFirst({
    where: { fieldId: field.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    field: {
      id: field.id,
      name: field.name,
      crop: field.crop,
      area_ha: Number(field.area_hectares),
      centroid: { lat: field.centroid_lat, lon: field.centroid_lon },
      registered_at: field.created_at.toISOString(),
    },
    last_ndvi: lastReading
      ? {
          mean: lastReading.ndviMean,
          observed_at: lastReading.observedAt.toISOString(),
        }
      : null,
    last_recommendation: lastRec
      ? {
          severity: lastRec.severity,
          title: lastRec.title,
          action: lastRec.action,
          created_at: lastRec.createdAt.toISOString(),
        }
      : null,
  });
}
