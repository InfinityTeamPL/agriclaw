import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';
import { classifyNdvi, describeNdvi } from '@/lib/satellite/ndvi';

/**
 * Agent wywołuje to narzędzie żeby dostać aktualny NDVI dla pola.
 * Zwraca dane z ostatnej analizy w DB; jeśli brak, wskazuje że trzeba odpalić
 * pełną analizę przez /api/analysis/[fieldId].
 */
export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const fieldId = req.nextUrl.searchParams.get('field_id');
  if (!fieldId) return NextResponse.json({ error: 'field_id required' }, { status: 400 });

  const field = await prisma.field.findFirst({
    where: { id: fieldId, farmId: auth.farmId, deletedAt: null },
    select: { id: true, name: true, crop: true },
  });
  if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  const [latest, previous] = await prisma.$transaction([
    prisma.ndviReading.findFirst({
      where: { fieldId },
      orderBy: { observedAt: 'desc' },
    }),
    prisma.ndviReading.findFirst({
      where: { fieldId, observedAt: { lt: new Date(Date.now() - 5 * 864e5) } },
      orderBy: { observedAt: 'desc' },
    }),
  ]);

  if (!latest) {
    return NextResponse.json({
      field,
      status: 'no_data',
      note: 'Brak zapisanej analizy. Uruchom /api/analysis/field_id żeby pobrać świeże NDVI.',
    });
  }

  return NextResponse.json({
    field,
    ndvi: {
      mean: latest.ndviMean,
      min: latest.ndviMin,
      max: latest.ndviMax,
      observed_at: latest.observedAt.toISOString(),
      classification: classifyNdvi(latest.ndviMean),
      description: describeNdvi(latest.ndviMean, field.crop),
    },
    trend: previous
      ? {
          previous_mean: previous.ndviMean,
          previous_observed_at: previous.observedAt.toISOString(),
          delta: latest.ndviMean - previous.ndviMean,
          delta_days: Math.round((latest.observedAt.getTime() - previous.observedAt.getTime()) / 864e5),
        }
      : null,
  });
}
