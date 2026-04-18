import { NextRequest, NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createFieldSchema } from '@/lib/schemas';

export async function GET() {
  const { user } = await requireAuth();

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
    SELECT f.id, f.farm_id, f.name, f.crop, f.area_hectares, f.created_at,
           ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.user_id = ${user.id}
    ORDER BY f.created_at DESC
  `;

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      farmId: r.farm_id,
      name: r.name,
      crop: r.crop,
      areaHectares: Number(r.area_hectares),
      polygon: JSON.parse(r.polygon),
      createdAt: r.created_at,
    })),
  );
}

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => null);
  const parsed = createFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { farmId, name, polygon, crop } = parsed.data;

  // Auth: pole musi być dla farmy użytkownika
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId: user.id },
  });
  if (!farm) {
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
  }

  // Oblicz powierzchnię w hektarach (turf zwraca m²)
  const feature = { type: 'Feature' as const, geometry: polygon, properties: {} };
  const areaSqM = turf.area(feature);
  const areaHectares = areaSqM / 10_000;

  // PostGIS insert
  const polygonJson = JSON.stringify(polygon);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "fields" (id, farm_id, name, crop, area_hectares, polygon, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      ${farmId},
      ${name},
      ${crop},
      ${areaHectares},
      ST_SetSRID(ST_GeomFromGeoJSON(${polygonJson}), 4326),
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  return NextResponse.json(
    {
      id: rows[0].id,
      farmId,
      name,
      crop,
      areaHectares,
      polygon,
    },
    { status: 201 },
  );
}
