// API dla scouting — obserwacji w polu.
// POST /api/scouting — nowa pinezka
// GET /api/scouting?fieldId=X — lista pinezek per pole (lub wszystkie farmy)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const scoutingSchema = z.object({
  fieldId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tag: z.enum(['disease', 'pest', 'frost', 'mechanical', 'weed', 'other']),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  note: z.string().max(2000).nullable().optional(),
  photoUrl: z.string().startsWith('data:image/').or(z.string().url()).nullable().optional(),
  aiDiagnosis: z.string().max(5000).nullable().optional(),
});

async function ensureFieldOwnership(userId: string, fieldId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT f.id FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${fieldId} AND fa.user_id = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function GET(req: NextRequest) {
  const { user } = await requireAuth();
  const fieldId = req.nextUrl.searchParams.get('fieldId');

  if (fieldId) {
    const ok = await ensureFieldOwnership(user.id, fieldId);
    if (!ok) return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    const items = await prisma.scouting.findMany({
      where: { fieldId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(items);
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      field_id: string;
      field_name: string;
      lat: number;
      lon: number;
      tag: string;
      severity: string;
      note: string | null;
      photo_url: string | null;
      resolved_at: Date | null;
      created_at: Date;
    }>
  >`
    SELECT s.id, s.field_id, f.name AS field_name,
           s.lat, s.lon, s.tag, s.severity, s.note, s.photo_url,
           s.resolved_at, s.created_at
    FROM "scoutings" s
    JOIN "fields" f ON f.id = s.field_id
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.user_id = ${user.id}
    ORDER BY s.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      fieldId: r.field_id,
      fieldName: r.field_name,
      lat: r.lat,
      lon: r.lon,
      tag: r.tag,
      severity: r.severity,
      note: r.note,
      photoUrl: r.photo_url,
      resolvedAt: r.resolved_at?.toISOString() ?? null,
      createdAt: r.created_at.toISOString(),
    })),
  );
}

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => null);
  const parsed = scoutingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ok = await ensureFieldOwnership(user.id, parsed.data.fieldId);
  if (!ok) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  const scouting = await prisma.scouting.create({ data: parsed.data });
  return NextResponse.json(scouting, { status: 201 });
}
