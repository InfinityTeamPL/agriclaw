'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">Ag</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </div>
          <span className={`font-bold text-lg ${scrolled ? 'text-gray-900' : 'text-white'}`}>
            AgriClaw
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/login"
            className={`px-4 py-2 rounded-lg font-medium text-sm hidden sm:inline-block transition ${
              scrolled
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            Zaloguj
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            Zacznij bezpłatnie
          </Link>
        </div>
      </div>
    </nav>
  );
}
