import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { updateFieldSchema } from '@/lib/schemas';

async function ensureOwnership(userId: string, fieldId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; farm_id: string }>>`
    SELECT f.id, f.farm_id FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${fieldId} AND fa.user_id = ${userId} AND f.deleted_at IS NULL
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
    FROM "fields" WHERE id = ${params.id} AND deleted_at IS NULL
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

  // Twarde usunięcie ATOMOWO tylko gdy pole nie ma ŻADNEGO zabiegu — jedno
  // zapytanie DELETE ... WHERE NOT EXISTS(...). Dzięki temu zabieg dodany w
  // międzyczasie (druga karta / agent AI) blokuje kasowanie i nie ma okna TOCTOU
  // między liczeniem a usuwaniem, które mogłoby zniszczyć prawnie wymaganą księgę.
  const hardDeleted = await prisma.$executeRaw`
    DELETE FROM "fields"
    WHERE id = ${params.id}
      AND NOT EXISTS (SELECT 1 FROM "treatments" WHERE field_id = ${params.id})
  `;
  if (hardDeleted > 0) {
    return NextResponse.json({ ok: true });
  }

  // Pole ma zabiegi → soft-delete chroni e-rejestr (IJHARS). updateMany nie
  // rzuca gdy 0 wierszy (np. równoległe usunięcie).
  const treatmentsPreserved = await prisma.treatment.count({
    where: { fieldId: params.id },
  });
  await prisma.field.updateMany({
    where: { id: params.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true, softDeleted: true, treatmentsPreserved });
}
