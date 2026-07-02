// PATCH / DELETE pojedynczego zabiegu

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Data: pełny ISO datetime LUB YYYY-MM-DD, z realnym sprawdzeniem kalendarza
// (zakotwiczony regex + Date.parse) — inaczej '2026-99-99' dawał 500. Audyt 2.MEDIUM.
const dateOnlyOrIso = z
  .string()
  .refine(
    (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) ? !Number.isNaN(Date.parse(v)) : !Number.isNaN(Date.parse(v)),
    'Nieprawidłowa data (YYYY-MM-DD lub ISO datetime)',
  );

const updateSchema = z.object({
  performedAt: dateOnlyOrIso.optional(),
  plannedAt: dateOnlyOrIso.nullable().optional(),
  purpose: z.string().max(100).nullable().optional(),
  productName: z.string().min(1).max(200).optional(),
  activeSubstance: z.string().max(500).nullable().optional(),
  doseValue: z.number().positive().nullable().optional(),
  doseUnit: z.string().max(20).nullable().optional(),
  areaTreated: z.number().positive().optional(),
  operatorName: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

async function ensureOwnership(userId: string, treatmentId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string; field_id: string }>>`
    SELECT t.id, t.field_id FROM "treatments" t
    JOIN "fields" f ON f.id = t.field_id
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE t.id = ${treatmentId} AND fa.user_id = ${userId}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const ok = await ensureOwnership(user.id, params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.performedAt) data.performedAt = new Date(parsed.data.performedAt);
  if (parsed.data.plannedAt) data.plannedAt = new Date(parsed.data.plannedAt);

  const updated = await prisma.treatment.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const ok = await ensureOwnership(user.id, params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.treatment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
