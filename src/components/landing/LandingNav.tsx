'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/brand/LogoMark';
import { Arrow, WRAP } from './ui';

// Nawigacja landingu „filmowego": przezroczysta na zdjęciu, ciemna po przewinięciu.
// Osobna od Navbar.tsx, który zostaje jasny dla /beta.
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-white/10 bg-[#0b1712]/85 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav
        aria-label="Główna nawigacja"
        className={`${WRAP} flex h-[72px] items-center justify-between gap-6 md:h-[88px]`}
      >
        <Link href="/" className="inline-flex items-center gap-3">
          <LogoMark size={34} />
          <span className="font-[family-name:var(--font-manrope)] text-[22px] font-extrabold tracking-[-0.07em]">
            AgriClaw
          </span>
        </Link>

        <div className="flex items-center gap-8 text-sm font-semibold">
          <a href="#jak" className="hidden hover:opacity-65 md:inline">
            Jak to działa
          </a>
          <a href="#mozliwosci" className="hidden hover:opacity-65 md:inline">
            Możliwości
          </a>
          <a href="#zrodla" className="hidden hover:opacity-65 lg:inline">
            Źródła danych
          </a>
          <Link href="/login" className="hidden hover:opacity-65 sm:inline">
            Zaloguj
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[42px] items-center gap-3 rounded-full bg-[#e8f2d9] px-4 text-xs font-bold text-[#10251b] transition hover:bg-white sm:min-h-12 sm:px-[22px] sm:text-sm"
          >
            Zacznij bezpłatnie <Arrow />
          </Link>
        </div>
      </nav>
    </header>
  );
}
