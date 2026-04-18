// POST /api/treatments — dodaje zabieg do księgi polowej
// GET /api/treatments?fieldId=X — lista zabiegów dla pola (lub wszystkich farm)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const treatmentSchema = z.object({
  fieldId: z.string().uuid(),
  performedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  plannedAt: z.string().datetime().nullable().optional(),
  type: z.enum(['spray', 'fertilizer', 'sowing', 'harvest', 'tillage', 'irrigation', 'mowing', 'other']),
  purpose: z.string().max(100).nullable().optional(),
  productName: z.string().min(1).max(200),
  activeSubstance: z.string().max(500).nullable().optional(),
  registrationNo: z.string().max(50).nullable().optional(),
  doseValue: z.number().positive().nullable().optional(),
  doseUnit: z.string().max(20).nullable().optional(),
  areaTreated: z.number().positive(),
  waterVolume: z.number().positive().nullable().optional(),
  operatorName: z.string().max(200).nullable().optional(),
  equipment: z.string().max(200).nullable().optional(),
  weatherTemp: z.number().nullable().optional(),
  weatherWind: z.number().nullable().optional(),
  weatherHumidity: z.number().min(0).max(100).nullable().optional(),
  weatherNotes: z.string().max(500).nullable().optional(),
  preHarvestIntervalDays: z.number().int().min(0).max(365).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
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
    const treatments = await prisma.treatment.findMany({
      where: { fieldId },
      orderBy: { performedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(treatments);
  }

  // Wszystkie zabiegi dla farm usera
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      field_id: string;
      field_name: string;
      field_crop: string;
      performed_at: Date;
      type: string;
      product_name: string;
      dose_value: number | null;
      dose_unit: string | null;
      area_treated: number;
    }>
  >`
    SELECT t.id, t.field_id, f.name AS field_name, f.crop AS field_crop,
           t.performed_at, t.type, t.product_name, t.dose_value, t.dose_unit, t.area_treated
    FROM "treatments" t
    JOIN "fields" f ON f.id = t.field_id
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.user_id = ${user.id}
    ORDER BY t.performed_at DESC
    LIMIT 200
  `;

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      fieldId: r.field_id,
      fieldName: r.field_name,
      fieldCrop: r.field_crop,
      performedAt: r.performed_at.toISOString(),
      type: r.type,
      productName: r.product_name,
      doseValue: r.dose_value,
      doseUnit: r.dose_unit,
      areaTreated: Number(r.area_treated),
    })),
  );
}

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => null);
  const parsed = treatmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ok = await ensureFieldOwnership(user.id, parsed.data.fieldId);
  if (!ok) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  const treatment = await prisma.treatment.create({
    data: {
      ...parsed.data,
      performedAt: new Date(parsed.data.performedAt),
      plannedAt: parsed.data.plannedAt ? new Date(parsed.data.plannedAt) : null,
    },
  });

  return NextResponse.json(treatment, { status: 201 });
}
