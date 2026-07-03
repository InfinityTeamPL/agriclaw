// Scouting — obserwacje w polu z pinezkami, foto, GPS, tagami.

import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ScoutingClient } from './ScoutingClient';

export const dynamic = 'force-dynamic';

export default async function ScoutingPage() {
  const { farm } = await requireFarm();

  const fields = await prisma.field.findMany({
    where: { farmId: farm.id, deletedAt: null },
    select: { id: true, name: true, crop: true },
    orderBy: { createdAt: 'asc' },
  });

  const scoutings = await prisma.scouting.findMany({
    where: { field: { farmId: farm.id } },
    orderBy: { createdAt: 'desc' },
    include: { field: { select: { id: true, name: true, crop: true } } },
    take: 100,
  });

  return (
    <ScoutingClient
      fields={fields}
      initial={scoutings.map((s) => ({
        id: s.id,
        fieldId: s.fieldId,
        fieldName: s.field.name,
        fieldCrop: s.field.crop,
        lat: s.lat,
        lon: s.lon,
        tag: s.tag,
        severity: s.severity,
        note: s.note,
        photoUrl: s.photoUrl,
        resolvedAt: s.resolvedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
