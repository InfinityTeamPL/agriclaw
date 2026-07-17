'use client';

// Warstwa „dlaczego" — pokazuje przesłanki, które uruchomiły zalecenie.
//
// PO CO: badania adopcji wskazują nieprzejrzystość AI jako barierę zaufania,
// a rolnicy odrzucają narzędzia, którym nie mogą zajrzeć w karty. To także
// konsekwencja zasady „wsparcie decyzji, nie polecenie": rolnik widzi wartość
// i próg, więc MOŻE SIĘ NIE ZGODZIĆ (np. wie, że lokalnie padało, a prognoza
// tego nie złapała). Zwinięte domyślnie — nie zaśmieca, ale jest na wyciągnięcie.

import { useState } from 'react';
import { ChevronDown, Microscope } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EvidenceItem {
  label: string;
  value: string;
  threshold: string | null;
  source: string;
}

export function WhyPanel({ why, ruleId }: { why: EvidenceItem[]; ruleId?: string | null }) {
  const [open, setOpen] = useState(false);

  if (!why || why.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-secondary/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <Microscope className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="hud-label">Dlaczego to zalecenie</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground ml-auto transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {why.map((e) => (
            <div
              key={`${e.label}-${e.value}`}
              className="flex items-baseline gap-2 text-[11px] leading-relaxed"
            >
              <span className="text-muted-foreground shrink-0">{e.label}:</span>
              <span className="font-mono tabular text-foreground font-medium shrink-0">
                {e.value}
              </span>
              {e.threshold && (
                <span className="text-muted-foreground truncate">— próg: {e.threshold}</span>
              )}
              <span className="text-muted-foreground/70 ml-auto shrink-0 text-[10px] hidden sm:inline">
                {e.source}
              </span>
            </div>
          ))}

          <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t border-border">
            To przesłanki reguły, nie wyrok. Znasz swoje pole lepiej — jeśli któraś się nie
            zgadza (np. lokalnie padało), potraktuj zalecenie odpowiednio.
            {ruleId && <span className="font-mono ml-1 opacity-60">[{ruleId}]</span>}
          </p>
        </div>
      )}
    </div>
  );
}
