'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fillDemo = () => {
    setEmail('demo@agriclaw.pl');
    setPassword('demo1234');
  };

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
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md shadow-card hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? 'Loguję...' : 'Zaloguj'}
          </button>

          <button
            type="button"
            onClick={fillDemo}
            className="w-full hud-label hover:text-foreground transition"
          >
            Użyj konta demo
          </button>
        </form>

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
