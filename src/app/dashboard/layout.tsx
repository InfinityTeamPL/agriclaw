// Dashboard layout — sidebar + topbar.
// requireFarm przekierowuje do /onboarding jeśli user nie ma farmy.

import { requireFarm } from '@/lib/session';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, farm } = await requireFarm();

  return (
    <DashboardShell
      farm={{ id: farm.id, name: farm.name, address: farm.address }}
      user={{ email: user.email, name: user.name }}
    >
      {children}
    </DashboardShell>
  );
}
