// Awatar użytkownika: inicjały na gradiencie dobieranym deterministycznie z adresu
// e-mail (ten sam człowiek = ten sam kolor na każdym urządzeniu). Bez Gravatara —
// nie wysyłamy skrótów e-mail do obcych serwisów (RODO).

import { cn } from '@/lib/utils';

// Para: ciemny początek gwarantuje kontrast białych inicjałów (≥ 4,5:1).
const PALETTE: Array<[string, string]> = [
  ['#14532d', '#15803d'], // łan
  ['#115e59', '#0f766e'], // woda
  ['#854d0e', '#a16207'], // ściernisko
  ['#1e3a8a', '#1d4ed8'], // niebo
  ['#581c87', '#7e22ce'], // bez
  ['#9a3412', '#c2410c'], // glina
];

export function initialsOf(name: string | null | undefined, email: string): string {
  const source = (name?.trim() || email).split(/[\s@._-]+/).filter(Boolean);
  const letters = source.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  return letters || 'AG';
}

export function paletteIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

export function UserAvatar({
  name,
  email,
  size = 32,
  className,
}: {
  name?: string | null;
  email: string;
  size?: number;
  className?: string;
}) {
  const [from, to] = PALETTE[paletteIndex(email.toLowerCase())];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold text-white ring-1 ring-black/5',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initialsOf(name, email)}
    </span>
  );
}
