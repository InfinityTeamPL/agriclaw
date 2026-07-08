'use client';

// Animowany licznik do value (ease-out). Przyjmuje format dla liczby (np. ha z 2 miejsc).
//
// Ważne: stan początkowy = wartość KOŃCOWA, nie 0. SSR i pierwszy paint pokazują
// prawdziwą liczbę; animacja 0→value startuje dopiero gdy karta jest realnie
// widoczna (rAF w ukrytej karcie nie odpala i rolnik widziałby zamrożone zera).
// Przy prefers-reduced-motion nie animujemy wcale.

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  format?: (v: number) => string;
  className?: string;
}

export function CountUp({ value, duration = 900, format, className }: Props) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || document.visibilityState !== 'visible') {
      setDisplay(value);
      return;
    }

    let start: number | null = null;
    const from = 0;
    const tick = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Gdy karta traci widoczność w trakcie animacji — dobij do wartości końcowej.
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        setDisplay(value);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const text = format ? format(display) : Math.round(display).toString();
  return <span className={className}>{text}</span>;
}
