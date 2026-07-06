// Zastrzeżenie „wsparcie decyzji, nie polecenie" — spójny banner pokazywany przy
// każdej rekomendacji dotyczącej ochrony roślin (opinia ekspercka, prof. Rutkowski 2026).
// Jedno źródło treści: @/lib/advisory.

import { Info } from 'lucide-react';
import { SOR_VERIFICATION_POINTS } from '@/lib/advisory';

interface Props {
  /** Wariant: pełny (z listą punktów) lub kompaktowy (jedna linia). */
  compact?: boolean;
  className?: string;
}

export function AdvisoryNotice({ compact = false, className }: Props) {
  return (
    <div
      className={
        'rounded-md border border-border bg-secondary/60 px-3 py-2.5 flex gap-2.5 text-xs text-muted-foreground ' +
        (className ?? '')
      }
      role="note"
    >
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-foreground/60" aria-hidden="true" />
      <div className="leading-relaxed">
        <span className="font-semibold text-foreground">Wsparcie decyzji, nie polecenie.</span>{' '}
        {compact ? (
          <>Przed zabiegiem ochrony roślin zweryfikuj etykietę środka, pogodę, fazę uprawy i przepisy. Decyzję podejmujesz sam.</>
        ) : (
          <>
            Ostateczną decyzję o zabiegu ochrony roślin podejmujesz sam i weryfikujesz ją z:
            <ul className="mt-1 ml-3 list-disc space-y-0.5">
              {SOR_VERIFICATION_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
