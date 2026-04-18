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
    <main className="min-h-screen relative overflow-hidden bg-[#f4f7f3] flex items-center justify-center p-4">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[480px] h-[480px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-lime-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl space-y-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/70 p-6 sm:p-10 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)]">
              <span className="text-white font-semibold text-sm">Ag</span>
            </div>
            <div>
              <span className="font-semibold text-lg text-gray-900 tracking-tight">AgriClaw</span>
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-700/80 text-left">
                Cyfrowy agronom
              </div>
            </div>
          </div>
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Dodaj swoje gospodarstwo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Trzy kroki, mniej niż minuta. Pola dorysujesz potem na mapie.
            </p>
          </div>
        </div>

        <OnboardingForm defaultName={user.name ? `Gospodarstwo ${user.name}` : ''} />
      </div>
    </main>
  );
}
