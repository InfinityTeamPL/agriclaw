'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled ? 'bg-background/90 border-b border-border shadow-card' : 'bg-transparent'
      }`}
    >
      {/* Sygnaturowa rampa NDVI jako górna krawędź stacji naziemnej */}
      <NdviKeyline className="absolute top-0 inset-x-0" height={2} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-card">
            <span className="text-primary-foreground font-display font-semibold text-sm">Ag</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-signal-healthy animate-pulse" />
          </div>
          <span
            className={`font-display font-semibold tracking-tight text-lg ${
              scrolled ? 'text-foreground' : 'text-white'
            }`}
          >
            AgriClaw
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/login"
            className={`px-4 py-2 rounded-md font-medium text-sm hidden sm:inline-block transition ${
              scrolled
                ? 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            Zaloguj
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-md font-semibold text-sm bg-primary text-primary-foreground hover:brightness-110 shadow-card transition"
          >
            Zacznij bezpłatnie
          </Link>
        </div>
      </div>
    </nav>
  );
}
