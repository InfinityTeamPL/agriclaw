// Znak AgriClaw: pole widziane z orbity — parcela pocięta na pasy rampy NDVI
// (żółty → zielony) i łuk orbity z satelitą. Czytelny już w 16 px (favicon).
// UWAGA: geometria jest zduplikowana w scripts/gen-icons.mjs (favicon/PWA/apple) —
// zmieniając znak, zmień oba miejsca i uruchom `npm run gen:icons`.

import { useId } from 'react';
import { cn } from '@/lib/utils';

export function LogoMark({
  size = 32,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Podaj, gdy znak stoi sam (bez nazwy obok) — czytniki ekranu. */
  title?: string;
}) {
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn('shrink-0 select-none rounded-[22%]', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect width="32" height="32" fill="#14532d" />
      {/* Przesunięcie na optyczny środek (łuk + satelita zawyżały środek ciężkości). */}
      <g transform="translate(-0.8 1.3)">
      <defs>
        <clipPath id={clipId}>
          <path d="M7.5 25 L12.5 11.5 H26 L21 25 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect y="11" width="32" height="5" fill="#facc15" />
        <rect y="16" width="32" height="4.5" fill="#84cc16" />
        <rect y="20.5" width="32" height="5" fill="#22c55e" />
      </g>
      <path d="M6 12.5 Q15 2.5 26 7" fill="none" stroke="#bef264" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="7" r="2" fill="#f8fafc" />
      </g>
    </svg>
  );
}
