import Link from 'next/link';
import type { ReactNode } from 'react';

// Wspólne klocki landingu „filmowego": eyebrow z kropką, przyciski-pigułki, tytuł sekcji.

export const WRAP = 'w-[min(100%-36px,1280px)] md:w-[min(100%-64px,1280px)] mx-auto';

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] ${className}`}
    >
      <span className="h-[7px] w-[7px] rounded-full bg-[#b4e46c]" />
      {children}
    </span>
  );
}

export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`my-5 font-[family-name:var(--font-manrope)] text-[clamp(36px,5vw,72px)] font-bold leading-[1.08] tracking-[-0.07em] ${className}`}
    >
      {children}
    </h2>
  );
}

const PILL =
  'inline-flex min-h-12 items-center justify-center gap-4 rounded-full px-[22px] text-sm font-bold transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

export function Pill({
  href,
  children,
  variant = 'light',
  className = '',
}: {
  href: string;
  children: ReactNode;
  variant?: 'light' | 'outline';
  className?: string;
}) {
  const tone =
    variant === 'light'
      ? 'bg-[#e8f2d9] text-[#10251b] hover:bg-white'
      : 'border border-current text-[#f1f4e9] hover:bg-white/10';
  return (
    <Link href={href} className={`${PILL} ${tone} ${className}`}>
      {children}
    </Link>
  );
}

export function Arrow() {
  return (
    <span aria-hidden="true" className="text-xl leading-none">
      ↗
    </span>
  );
}
