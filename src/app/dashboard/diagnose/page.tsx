// Diagnoza z kamery — rolnik robi zdjęcie liścia, dostaje diagnozę AgroAgent.

import { requireFarm } from '@/lib/session';
import { DiagnoseClient } from './DiagnoseClient';

export const dynamic = 'force-dynamic';

export default async function DiagnosePage() {
  const { farm } = await requireFarm();
  return (
    <DiagnoseClient
      fields={farm.fields.map((f) => ({ id: f.id, name: f.name, crop: f.crop }))}
    />
  );
}
