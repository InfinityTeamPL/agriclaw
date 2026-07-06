'use client';

import { signIn } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const demoTriggered = useRef(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error('Niepoprawny email lub hasło');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  // Jeden klik = wejście na gotowe gospodarstwo demo. Konto jest publiczne
  // (seed), więc nie ma tu sekretu — chodzi o zerowy próg wejścia dla nowych.
  const demoLogin = async () => {
    if (demoLoading || loading) return;
    setDemoLoading(true);
    const res = await signIn('credentials', {
      email: 'demo@agriclaw.pl',
      password: 'demo1234',
      redirect: false,
    });
    setDemoLoading(false);
    if (res?.error) {
      toast.error('Konto demo chwilowo niedostępne. Spróbuj ponownie.');
      return;
    }
    toast.success('Oglądasz gospodarstwo demo — możesz klikać wszystko.');
    router.push('/dashboard');
    router.refresh();
  };

  // Link "zobacz demo" z landingu/kampanii: /login?demo=1 → od razu logujemy.
  useEffect(() => {
    if (demoTriggered.current) return;
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1') {
      demoTriggered.current = true;
      void demoLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-secondary p-4">
      {/* Tło: siatka kartograficzna zamiast gradientu */}
      <div
        className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm space-y-6 bg-card rounded-lg border border-border p-8 shadow-card">
        {/* Sygnatura marki: rampa NDVI jako górna krawędź karty */}
        <NdviKeyline className="absolute inset-x-0 top-0 rounded-t-lg" height={3} rounded={false} />

        <div className="space-y-1 text-center">
          <Link href="/" className="inline-block">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">Ag</span>
              </div>
              <span className="font-display font-semibold text-lg tracking-tight text-foreground">
                AgriClaw
              </span>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight pt-2">Zaloguj się</h1>
          <p className="hud-label">Stacja naziemna · cyfrowy agronom</p>
        </div>

        {googleEnabled && (
          <>
            <GoogleButton callbackUrl="/dashboard" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 hud-label">lub</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleCredentials} className="space-y-4">
          <div>
            <label htmlFor="email" className="block hud-label mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="password" className="block hud-label mb-1.5">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md shadow-card hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? 'Loguję...' : 'Zaloguj'}
          </button>
        </form>

        {/* Demo: pełnoprawny, widoczny przycisk — jeden klik i jesteś w środku.
            Nowy użytkownik nie musi nic wpisywać ani się rejestrować. */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 hud-label">pierwszy raz tutaj?</span>
          </div>
        </div>

        <button
          type="button"
          onClick={demoLogin}
          disabled={demoLoading || loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-md border border-signal-healthy/40 bg-signal-healthy/5 text-foreground font-semibold hover:bg-signal-healthy/10 hover:border-signal-healthy/60 disabled:opacity-60 transition"
        >
          <Compass className="w-4 h-4 text-signal-healthy" />
          {demoLoading ? 'Otwieram gospodarstwo demo…' : 'Wypróbuj konto demo'}
        </button>
        <p className="text-xs text-center text-muted-foreground -mt-3">
          Gotowe gospodarstwo z polami i analizami — bez rejestracji, bez karty.
        </p>

        <p className="text-sm text-center text-muted-foreground">
          Nie masz konta?{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
