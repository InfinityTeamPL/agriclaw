// Onboarding — nowe gospodarstwo
// Server component: sprawdza czy user ma już farmę (redirect do /dashboard),
// inaczej renderuje wizard (OnboardingForm).

import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OnboardingForm } from './OnboardingForm';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { user } = await requireAuth();

  const existing = await prisma.farm.findFirst({
    where: { userId: user.id, suspended: false },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-secondary flex items-center justify-center p-4">
      {/* Tło: siatka kartograficzna zamiast dekoracyjnych blobów */}
      <div
        className="pointer-events-none absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl space-y-6 bg-card rounded-lg border border-border p-6 sm:p-10 shadow-pop">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-semibold text-sm">Ag</span>
            </div>
            <div>
              <span className="font-display font-semibold text-lg text-foreground tracking-tight">AgriClaw</span>
              <div className="hud-label text-left">
                Cyfrowy agronom
              </div>
            </div>
          </div>
          <div className="pt-2">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Dodaj swoje gospodarstwo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trzy kroki, mniej niż minuta. Pola dorysujesz potem na mapie.
            </p>
          </div>
        </div>

        <OnboardingForm defaultName={user.name ? `Gospodarstwo ${user.name}` : ''} />
      </div>
    </main>
  );
}
