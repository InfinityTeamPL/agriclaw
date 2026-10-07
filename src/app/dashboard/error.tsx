'use client';

// Granica błędu panelu: awaria jednej strony nie zostawia rolnika z angielskim ekranem
// Next.js. Nawigacja panelu (layout) zostaje, a on może ponowić albo wrócić na pulpit.

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard] błąd strony', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-card border border-border mb-5">
        <AlertTriangle className="w-7 h-7 text-signal-heat" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Coś poszło nie tak
      </h1>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        Nie udało się wyświetlić tej strony. To zwykle chwilowy problem z połączeniem lub danymi.
        Spróbuj ponownie. Twoje dane są bezpieczne.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110 transition"
        >
          <RotateCw className="w-4 h-4" aria-hidden="true" />
          Spróbuj ponownie
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center min-h-11 px-5 rounded-md border border-border bg-card font-medium text-foreground hover:bg-secondary transition"
        >
          Wróć do pulpitu
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-[11px] font-mono text-muted-foreground">Kod błędu: {error.digest}</p>
      )}
    </div>
  );
}
