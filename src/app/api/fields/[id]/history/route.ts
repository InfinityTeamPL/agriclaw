// GET /api/fields/[id]/history — historyczne NDVI time-series z DB (NdviReading).
// POST /api/fields/[id]/history/backfill?years=5 — pobiera z CDSE miesięczne NDVI wstecz.
//
// Sentinel-2 działa od czerwca 2015. Pozwalamy na backfill do 10 lat.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  // Verify ownership
  const rows = await prisma.$queryRaw<Array<{ id: string; crop: string }>>`
    SELECT f.id, f.crop FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.id} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Wykluczamy odczyty mock (source='mock') — historia/trendy mają pokazywać
  // wyłącznie realne pomiary satelitarne (patrz audyt 2.3).
  const readings = await prisma.ndviReading.findMany({
    where: { fieldId: params.id, source: { not: 'mock' } },
    orderBy: { observedAt: 'asc' },
    take: 500,
  });

  // Group by month dla agregacji
  const byMonth = new Map<string, { sum: number; count: number; max: number; min: number }>();
  for (const r of readings) {
    const key = r.observedAt.toISOString().slice(0, 7); // YYYY-MM
    const existing = byMonth.get(key) ?? { sum: 0, count: 0, max: -1, min: 2 };
    existing.sum += r.ndviMean;
    existing.count += 1;
    existing.max = Math.max(existing.max, r.ndviMean);
    existing.min = Math.min(existing.min, r.ndviMean);
    byMonth.set(key, existing);
  }

  const monthly = Array.from(byMonth.entries())
    .map(([month, v]) => ({
      month,
      mean: v.sum / v.count,
      max: v.max,
      min: v.min,
      samples: v.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Year-over-year aggregation
  const byYear = new Map<string, { values: number[]; maxGrowing: number }>();
  for (const r of readings) {
    const year = r.observedAt.getFullYear().toString();
    const month = r.observedAt.getMonth() + 1;
    const isGrowingSeason = month >= 4 && month <= 9;
    if (!isGrowingSeason) continue;
    const existing = byYear.get(year) ?? { values: [], maxGrowing: 0 };
    existing.values.push(r.ndviMean);
    existing.maxGrowing = Math.max(existing.maxGrowing, r.ndviMean);
    byYear.set(year, existing);
  }

  const yearly = Array.from(byYear.entries())
    .map(([year, v]) => ({
      year,
      peak: v.maxGrowing,
      avg: v.values.reduce((a, b) => a + b, 0) / v.values.length,
      samples: v.values.length,
    }))
    .sort((a, b) => a.year.localeCompare(b.year));

  return NextResponse.json({
    fieldId: params.id,
    totalReadings: readings.length,
    monthly,
    yearly,
    oldestYear: yearly[0]?.year ?? null,
    newestYear: yearly[yearly.length - 1]?.year ?? null,
    needsBackfill: readings.length < 12, // mniej niż rok historii
  });
}
