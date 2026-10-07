'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchJson } from '@/lib/ui/api-error';
import Link from 'next/link';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { LogoMark } from '@/components/brand/LogoMark';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; exists?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const created = await fetchJson(
        '/api/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        },
        'Nie udało się utworzyć konta. Spróbuj ponownie.',
      );
      if (!created.ok) {
        setError({ text: created.message, exists: created.status === 409 });
        return;
      }

      const login = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (login?.error) {
        toast.error('Konto utworzone. Zaloguj się, żeby zacząć.');
        router.push('/login');
        return;
      }
      router.push('/onboarding');
      router.refresh();
    } catch {
      setError({ text: 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Tło: siatka kartograficzna zamiast gradientu */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-secondary" />
        <div className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative w-full max-w-sm bg-card rounded-lg border border-border shadow-card overflow-hidden">
        {/* Sygnatura marki: rampa NDVI na górnej krawędzi karty */}
        <NdviKeyline className="absolute top-0 left-0" height={3} />

        <div className="space-y-6 p-8">
          <div className="space-y-1 text-center">
            <Link href="/" className="inline-block">
              <div className="inline-flex items-center gap-2">
                <LogoMark size={32} />
                <span className="font-display font-semibold text-lg tracking-tight text-foreground">
                  AgriClaw
                </span>
              </div>
            </Link>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground pt-2">
              Załóż konto
            </h1>
            <p className="text-sm text-muted-foreground">
              Pierwszy oprysk w odpowiedni dzień. Potem już pamiętasz.
            </p>
          </div>

          {googleEnabled && (
            <>
              <GoogleButton callbackUrl="/onboarding" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="hud-label bg-card px-2">lub</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="hud-label block mb-1.5">
                Imię
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-11 px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
              />
            </div>
            <div>
              <label htmlFor="email" className="hud-label block mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 px-3 py-2 bg-background border border-input rounded-md font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
              />
            </div>
            <div>
              <label htmlFor="password" className="hud-label block mb-1.5">
                Hasło (min 8 znaków)
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-11 px-3 py-2 bg-background border border-input rounded-md font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error.text}{' '}
                {error.exists && (
                  <Link href="/login" className="font-semibold underline underline-offset-2">
                    Zaloguj się
                  </Link>
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 bg-primary text-primary-foreground font-semibold py-2.5 rounded-md shadow-card hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {loading ? 'Tworzę konto...' : 'Utwórz konto'}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              Zakładając konto, akceptujesz{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                Regulamin
              </Link>{' '}
              i{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                Politykę prywatności
              </Link>
              .
            </p>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Masz już konto?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
