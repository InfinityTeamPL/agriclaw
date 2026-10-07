'use client';

// Granica błędu dla stron poza panelem (landing, logowanie, rejestracja, onboarding).

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] błąd strony', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-card border border-border mb-6">
          <AlertTriangle className="w-8 h-8 text-signal-heat" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-3">
          Coś poszło nie tak
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Nie udało się wyświetlić tej strony. Spróbuj ponownie za chwilę.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110 transition"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            Spróbuj ponownie
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-11 px-6 rounded-md border border-border bg-card font-medium text-foreground hover:bg-secondary transition"
          >
            Strona główna
          </Link>
        </div>
      </div>
    </main>
  );
}
