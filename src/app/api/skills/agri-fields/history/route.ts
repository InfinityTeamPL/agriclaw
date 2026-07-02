import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';

export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const fieldId = req.nextUrl.searchParams.get('field_id');
  const daysStr = req.nextUrl.searchParams.get('days') ?? '90';
  const days = Math.min(Math.max(parseInt(daysStr, 10) || 90, 1), 365);

  if (!fieldId) return NextResponse.json({ error: 'field_id required' }, { status: 400 });

  const field = await prisma.field.findFirst({
    where: { id: fieldId, farmId: auth.farmId, deletedAt: null },
    select: { id: true, name: true, crop: true },
  });
  if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  const from = new Date(Date.now() - days * 864e5);

  const readings = await prisma.ndviReading.findMany({
    where: { fieldId, observedAt: { gte: from } },
    orderBy: { observedAt: 'asc' },
  });

  const recommendations = await prisma.recommendation.findMany({
    where: { fieldId, createdAt: { gte: from } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    field,
    window_days: days,
    ndvi_history: readings.map((r) => ({
      observed_at: r.observedAt.toISOString(),
      mean: r.ndviMean,
      min: r.ndviMin,
      max: r.ndviMax,
    })),
    recommendations_history: recommendations.map((r) => ({
      id: r.id,
      severity: r.severity,
      title: r.title,
      action: r.action,
      created_at: r.createdAt.toISOString(),
    })),
  });
}
