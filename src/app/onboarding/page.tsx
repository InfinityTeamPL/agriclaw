// Onboarding — nowe gospodarstwo
// Server component: sprawdza czy user ma już farmę (redirect do /dashboard),
// inaczej renderuje formularz (OnboardingForm).

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
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Ag</span>
            </div>
            <span className="font-bold text-lg text-gray-900">AgriClaw</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 pt-2">
            Dodaj swoje gospodarstwo
          </h1>
          <p className="text-sm text-gray-500">
            Zacznij od podania nazwy i adresu. Potem dorysujesz pola na mapie.
          </p>
        </div>

        <OnboardingForm defaultName={user.name ? `Gospodarstwo ${user.name}` : ''} />
      </div>
    </main>
  );
}
