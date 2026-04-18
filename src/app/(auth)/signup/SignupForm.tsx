'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { GoogleButton } from '@/components/auth/GoogleButton';

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Błąd rejestracji' }));
      toast.error(typeof data.error === 'string' ? data.error : 'Nie udało się utworzyć konta');
      setLoading(false);
      return;
    }

    const login = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);
    if (login?.error) {
      toast.error('Konto utworzone, ale logowanie nie powiodło się');
      router.push('/login');
      return;
    }
    router.push('/onboarding');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="w-full max-w-sm space-y-6 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <Link href="/" className="inline-block">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ag</span>
              </div>
              <span className="font-bold text-lg text-gray-900">AgriClaw</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold pt-2">Załóż konto</h1>
          <p className="text-sm text-gray-500">
            Pierwszy oprysk w odpowiedni dzień. Potem już pamiętasz.
          </p>
        </div>

        {googleEnabled && (
          <>
            <GoogleButton callbackUrl="/onboarding" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">lub</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Imię</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Hasło (min 8 znaków)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? 'Tworzę konto...' : 'Utwórz konto'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          Masz już konto?{' '}
          <Link href="/login" className="text-emerald-600 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
