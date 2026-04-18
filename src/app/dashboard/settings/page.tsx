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
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-sm text-gray-500">
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
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Gospodarstwo</h2>
          <dl className="text-sm text-gray-700 space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Nazwa</dt>
              <dd className="text-right">{farm.name}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Adres</dt>
              <dd className="text-right">{farm.address}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Plan</dt>
              <dd className="text-right capitalize">{farm.plan}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
