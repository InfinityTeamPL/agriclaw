// Ustawienia profilu użytkownika.
// Server component ładuje świeże dane usera, client form zapisuje przez PATCH /api/user.

import { requireAuth, getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { SettingsForm } from './SettingsForm';
import { PushToggle } from '@/components/dashboard/PushToggle';

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
          Dane kontaktowe i profil rolnika.
        </p>
      </div>

      <PushToggle />

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
              <dd className="text-right">{farm.plan === 'free' ? 'Darmowy' : farm.plan}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Prawa z RODO obiecane w Polityce prywatności: pobranie danych i zamknięcie konta. */}
      <section className="bg-card border border-border rounded-lg shadow-card p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">Twoje dane</h2>
        <p className="text-sm text-muted-foreground">
          Twoje dane należą do Ciebie. Możesz pobrać wszystko, co o Tobie przechowujemy, albo poprosić o
          zamknięcie konta.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="/api/user/export"
            className="inline-flex items-center justify-center min-h-11 px-4 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition"
          >
            Pobierz wszystkie dane (JSON)
          </a>
          <a
            href="/api/treatments/export?format=csv"
            className="inline-flex items-center justify-center min-h-11 px-4 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition"
          >
            Księga polowa (CSV)
          </a>
          <a
            href={`mailto:contact@infinityteam.io?subject=${encodeURIComponent('Usunięcie konta AgriClaw')}&body=${encodeURIComponent(`Proszę o usunięcie mojego konta i danych. Adres konta: ${user.email}`)}`}
            className="inline-flex items-center justify-center min-h-11 px-4 rounded-md border border-destructive/40 bg-card text-sm font-medium text-destructive hover:bg-destructive/5 transition"
          >
            Poproś o usunięcie konta
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Konto usuwamy w ciągu 30 dni od prośby. Wpisy księgi polowej możemy przechowywać dłużej, jeśli
          wymagają tego przepisy.
        </p>
      </section>
    </div>
  );
}
