// Ustawienia profilu użytkownika.
// Server component ładuje świeże dane usera, client form zapisuje przez PATCH /api/user.

import { requireAuth, getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireAuth();
  const user = await getCurrentUser();
  if (!user) {
    // requireAuth już by redirectował, ale TS i tak tego pilnuje
    return null;
  }

  const farm = await prisma.farm.findFirst({
    where: { userId: user.id, suspended: false },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Ustawienia</h1>
        <p className="text-sm text-muted-foreground">
          Dane kontaktowe i profil rolnika. Numer telefonu jest używany do WhatsApp.
        </p>
      </div>

      <SettingsForm
        defaultValues={{
          email: user.email,
          name: user.name ?? '',
          phoneNumber: user.phoneNumber ?? '',
        }}
      />

      {farm && (
        <div className="bg-card border border-border rounded-lg shadow-card p-4 space-y-2">
          <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">Gospodarstwo</h2>
          <dl className="text-sm text-foreground space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Nazwa</dt>
              <dd className="text-right">{farm.name}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Adres</dt>
              <dd className="text-right">{farm.address}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="text-right capitalize">{farm.plan}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
