// Księga polowa — e-rejestr zabiegów agrotechnicznych.
// Obowiązek prawny PL/UE dla gospodarstw > 10 ha.

import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { JournalClient } from './JournalClient';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const { farm } = await requireFarm();

  const fields = await prisma.field.findMany({
    where: { farmId: farm.id, deletedAt: null },
    select: { id: true, name: true, crop: true, areaHectares: true },
    orderBy: { createdAt: 'asc' },
  });

  const treatments = await prisma.treatment.findMany({
    where: { field: { farmId: farm.id } },
    orderBy: { performedAt: 'desc' },
    include: { field: { select: { id: true, name: true, crop: true } } },
    take: 200,
  });

  return (
    <JournalClient
      farmId={farm.id}
      fields={fields.map((f) => ({
        id: f.id,
        name: f.name,
        crop: f.crop,
        areaHectares: f.areaHectares,
      }))}
      treatments={treatments.map((t) => ({
        id: t.id,
        fieldId: t.fieldId,
        fieldName: t.field.name,
        fieldCrop: t.field.crop,
        performedAt: t.performedAt.toISOString(),
        type: t.type,
        purpose: t.purpose,
        productName: t.productName,
        activeSubstance: t.activeSubstance,
        doseValue: t.doseValue,
        doseUnit: t.doseUnit,
        areaTreated: t.areaTreated,
        operatorName: t.operatorName,
        weatherTemp: t.weatherTemp,
        weatherWind: t.weatherWind,
        preHarvestIntervalDays: t.preHarvestIntervalDays,
        notes: t.notes,
      }))}
    />
  );
}
