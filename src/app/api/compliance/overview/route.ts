// GET /api/compliance/overview — raport zgodności WPR 2023-2027 / IJHARS dla gospodarstwa.
// Łączy strukturę pól, historię zabiegów i reguły dywersyfikacji/rotacji.

import { NextResponse } from 'next/server';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { loadComplianceReport } from '@/lib/compliance-data';

export async function GET() {
  const { farm } = await requireFarm();

  const { report, fields, totalHectares } = await loadComplianceReport(farm.id);

  return NextResponse.json({
    farm: { id: farm.id, name: farm.name, address: farm.address },
    report,
    cropDistribution: Array.from(
      fields.reduce((m, f) => {
        m.set(f.crop, (m.get(f.crop) ?? 0) + f.areaHectares);
        return m;
      }, new Map<string, number>()).entries(),
    ).map(([crop, ha]) => ({ crop, ha, pct: totalHectares > 0 ? (ha / totalHectares) * 100 : 0 })),
  });
}
