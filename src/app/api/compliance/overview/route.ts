// GET /api/compliance/overview — raport zgodności WPR 2023-2027 / IJHARS dla gospodarstwa.
// Łączy strukturę pól, historię zabiegów i reguły dywersyfikacji/rotacji.

import { NextResponse } from 'next/server';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { evaluateCompliance } from '@/lib/compliance';

export async function GET() {
  const { farm } = await requireFarm();

  const fields = await prisma.field.findMany({
    where: { farmId: farm.id },
    select: {
      id: true,
      name: true,
      crop: true,
      areaHectares: true,
      treatments: {
        where: {
          performedAt: {
            gte: new Date(new Date().getFullYear(), 0, 1), // sezon = od 1 stycznia tego roku
          },
        },
        select: { performedAt: true, type: true },
        orderBy: { performedAt: 'desc' },
      },
    },
  });

  // Historia upraw (previousCrops) — wyciągamy z Treatment.type='sowing' z ostatnich 4 lat.
  // Jeśli brak takich wpisów, pole nie ma wyznaczonej historii i rotacja nie jest sprawdzana.
  const cutoff = new Date(new Date().getFullYear() - 4, 0, 1);
  const sowings = await prisma.treatment.findMany({
    where: {
      field: { farmId: farm.id },
      type: 'sowing',
      performedAt: { gte: cutoff },
    },
    select: { fieldId: true, performedAt: true, productName: true },
    orderBy: { performedAt: 'asc' },
  });

  const previousByField = new Map<string, string[]>();
  for (const s of sowings) {
    const arr = previousByField.get(s.fieldId) ?? [];
    // productName typowo zawiera nazwę odmiany — heurystyka żeby wydobyć crop.
    const lower = s.productName.toLowerCase();
    let crop = 'other';
    if (/pszen/.test(lower)) crop = 'wheat';
    else if (/rzepak/.test(lower)) crop = 'rapeseed';
    else if (/kukurydz/.test(lower)) crop = 'corn';
    else if (/jęczm|jeczm/.test(lower)) crop = 'barley';
    else if (/żyt|zyt/.test(lower)) crop = 'rye';
    else if (/owi|owies/.test(lower)) crop = 'oats';
    else if (/ziemniak/.test(lower)) crop = 'potato';
    else if (/burak/.test(lower)) crop = 'sugarbeet';
    arr.push(crop);
    previousByField.set(s.fieldId, arr);
  }

  const totalHectares = fields.reduce((s, f) => s + f.areaHectares, 0);

  const report = evaluateCompliance({
    totalHectares,
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: f.areaHectares,
      previousCrops: previousByField.get(f.id),
      treatmentsCountThisSeason: f.treatments.length,
      lastTreatmentAt: f.treatments[0]?.performedAt ?? null,
    })),
  });

  return NextResponse.json({
    farm: { id: farm.id, name: farm.name, address: farm.address },
    report,
    cropDistribution: Array.from(
      fields.reduce((m, f) => {
        m.set(f.crop, (m.get(f.crop) ?? 0) + f.areaHectares);
        return m;
      }, new Map<string, number>()).entries(),
    ).map(([crop, ha]) => ({ crop, ha, pct: (ha / totalHectares) * 100 })),
  });
}
