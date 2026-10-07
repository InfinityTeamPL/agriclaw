// Księga polowa — e-rejestr zabiegów agrotechnicznych.
// Ewidencja zabiegów ŚOR dotyczy każdego profesjonalnego użytkownika (bez progu hektarów).

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

  // Licznik z bazy, nie z długości pobranej listy — inaczej ewidencja po cichu „kończyła się" na 200.
  const totalCount = await prisma.treatment.count({ where: { field: { farmId: farm.id } } });

  return (
    <JournalClient
      farmId={farm.id}
      totalCount={totalCount}
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
