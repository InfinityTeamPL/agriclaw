import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { updateFieldSchema } from '@/lib/schemas';

async function ensureOwnership(userId: string, fieldId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; farm_id: string }>>`
    SELECT f.id, f.farm_id FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${fieldId}::uuid AND fa.user_id = ${userId}::uuid
  `;
  return rows[0] ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const ownership = await ensureOwnership(user.id, params.id);
  if (!ownership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      farm_id: string;
      name: string;
      crop: string;
      area_hectares: number;
      polygon: string;
      created_at: Date;
    }>
  >`
    SELECT id, farm_id, name, crop, area_hectares, created_at,
           ST_AsGeoJSON(polygon)::text AS polygon
    FROM "fields" WHERE id = ${params.id}::uuid
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const readings = await prisma.ndviReading.findMany({
    where: { fieldId: field.id },
    orderBy: { observedAt: 'desc' },
    take: 20,
  });

  const recommendations = await prisma.recommendation.findMany({
    where: { fieldId: field.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    id: field.id,
    farmId: field.farm_id,
    name: field.name,
    crop: field.crop,
    areaHectares: Number(field.area_hectares),
    polygon: JSON.parse(field.polygon),
    createdAt: field.created_at,
    ndviHistory: readings.map((r) => ({
      observedAt: r.observedAt,
      mean: r.ndviMean,
      min: r.ndviMin,
      max: r.ndviMax,
      cloudCover: r.cloudCover,
    })),
    recommendations,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const ownership = await ensureOwnership(user.id, params.id);
  if (!ownership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.field.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const ownership = await ensureOwnership(user.id, params.id);
  if (!ownership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.field.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
