// Wizard deploy agenta — 3 kroki: model → kanał → potwierdzenie.
// Server component otacza client form że requireFarm zrobi redirect do /onboarding.

import { requireFarm } from '@/lib/session';
import { DeployAgentWizard } from './DeployAgentWizard';

export const dynamic = 'force-dynamic';

export default async function DeployAgentPage() {
  const { farm } = await requireFarm();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <DeployAgentWizard
        farmId={farm.id}
        farmName={farm.name}
      />
    </div>
  );
}
