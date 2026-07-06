'use client';

// Animowana wizualizacja "skan pola z góry" — serce landingu.
// Czysty CSS + SVG, zero dependencji. Idzie nawet na telefonie z 4G.
//
// Warstwy:
// 1. Grid pól w widoku z góry (top-down, lekki tilt) z kolorami zdrowia roślin
// 2. Animowany skan (beam) przelatujący od lewej do prawej — wiadro pól podświetla się po kolei
// 3. Sensor (SVG) powyżej krawędzi kadru, z orbit trail
// 4. Dane które wyskakują po zeskanowaniu: średnie zdrowie, wilgotność, okno działania

import { useEffect, useMemo, useState } from 'react';
import { ndviColorHex } from '@/lib/design/ndvi-scale';

const FIELD_COLS = 8;
const FIELD_ROWS = 6; // wyższa karta = bogatsza siatka pola

type Patch = {
  key: string;
  row: number;
  col: number;
  ndvi: number;
  delay: number;
};

// Kolor zdrowia roślin z KANONICZNEJ rampy NDVI (jedno źródło = brand).
const ndviColor = ndviColorHex;

export function SatelliteScanner() {
  const [scanActive, setScanActive] = useState(false);

  const patches = useMemo<Patch[]>(() => {
    const out: Patch[] = [];
    const rng = mulberry32(42); // deterministic layout
    for (let row = 0; row < FIELD_ROWS; row++) {
      for (let col = 0; col < FIELD_COLS; col++) {
        // mozaika ze „stresem" w jednym rogu dla dramaturgii
        const distFromStressed = Math.hypot(col - 1, row - 3);
        const base = 0.72 - Math.max(0, 4 - distFromStressed) * 0.1;
        const noise = (rng() - 0.5) * 0.12;
        const ndvi = Math.max(0.12, Math.min(0.85, base + noise));
        out.push({
          key: `${row}-${col}`,
          row,
          col,
          ndvi,
          delay: col * 0.08 + (rng() - 0.5) * 0.1,
        });
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setScanActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full flex flex-col gap-3">
    {/* Karta animacji — wyższa (4/3 mobile, 6/5 desktop); karty danych są POD nią,
        żeby nie zasłaniały siatki pola. */}
    <div className="relative w-full aspect-[4/3] sm:aspect-[6/5] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-950 via-sky-900 to-emerald-950 shadow-2xl ring-1 ring-black/5">
      {/* ────── Gwiazdy / atmosfera (tło satelity) ────── */}
      <div className="absolute inset-0 pointer-events-none">
        <Stars />
      </div>

      {/* ────── Orbita + satelita ────── */}
      <div className="absolute inset-x-0 top-0 h-[40%] pointer-events-none">
        <Satellite />
      </div>

      {/* ────── Pole w widoku z góry ────── */}
      <div className="absolute bottom-0 left-0 right-0 h-[65%]">
        <div
          className="relative w-full h-full"
          style={{
            transform: 'perspective(900px) rotateX(48deg) scale(1.06)',
            transformOrigin: 'center bottom',
          }}
        >
          {/* siatka pól */}
          <div
            className="absolute inset-2 grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${FIELD_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${FIELD_ROWS}, 1fr)`,
            }}
          >
            {patches.map((p) => (
              <div
                key={p.key}
                className="relative rounded-[3px] overflow-hidden"
                style={{
                  background: ndviColor(p.ndvi),
                  opacity: scanActive ? 1 : 0.15,
                  transform: scanActive ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity 700ms cubic-bezier(.2,.7,.3,1) ${p.delay}s, transform 700ms cubic-bezier(.2,.7,.3,1) ${p.delay}s`,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                }}
              >
                {/* subtle texture */}
                <div
                  className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(255,255,255,.3), transparent 55%)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* skanujący beam */}
          {scanActive && (
            <div
              className="absolute inset-y-0 w-[25%] pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(56,189,248,0.35) 45%, rgba(14,165,233,0.55) 50%, rgba(56,189,248,0.35) 55%, transparent)',
                filter: 'blur(1.5px)',
                animation: 'scan 5s ease-in-out infinite alternate',
              }}
            />
          )}

          {/* linia skanująca pionowa */}
          {scanActive && (
            <div
              className="absolute inset-y-0 w-[2px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(56,189,248,0), rgba(56,189,248,1) 40%, rgba(56,189,248,1) 60%, rgba(56,189,248,0))',
                boxShadow: '0 0 20px rgba(56,189,248,0.9), 0 0 40px rgba(56,189,248,0.5)',
                animation: 'scanLine 5s ease-in-out infinite alternate',
              }}
            />
          )}
        </div>
      </div>

      {/* ────── HUD (górny pasek statusu) ────── */}
      <Hud />

      {/* ────── animacje CSS ────── */}
      <style jsx>{`
        @keyframes scan {
          0% {
            left: -25%;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes scanLine {
          0% {
            left: 0%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>

    {/* ────── Odczyty POD animacją — instrumenty stacji naziemnej ────── */}
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <StatCard label="Zdrowie pola" value="0.42" note="spadek" tone="drought" show={scanActive} delay={0.9} />
      <StatCard label="Wilgoć gleby" value="18%" note="niska" tone="heat" show={scanActive} delay={1.05} />
      <StatCard label="Okno oprysku" value="5:30" note="jutro" tone="healthy" show={scanActive} delay={1.2} />
    </div>
    </div>
  );
}

// Karta odczytu pod animacją: jasny instrument (tokeny bg-card/border) z kolorem
// DANYCH w systemie signal-*; wjeżdża po zakończeniu skanu (delay per karta).
function StatCard({
  label,
  value,
  note,
  tone,
  show,
  delay,
}: {
  label: string;
  value: string;
  note: string;
  tone: 'healthy' | 'heat' | 'drought';
  show: boolean;
  delay: number;
}) {
  const toneText =
    tone === 'healthy'
      ? 'text-signal-healthy'
      : tone === 'heat'
        ? 'text-signal-heat'
        : 'text-signal-drought';
  const toneDot =
    tone === 'healthy'
      ? 'bg-signal-healthy'
      : tone === 'heat'
        ? 'bg-signal-heat'
        : 'bg-signal-drought';
  return (
    <div
      className="rounded-lg bg-card border border-border shadow-card px-3 py-2.5 sm:px-4 sm:py-3"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 600ms cubic-bezier(.2,.7,.3,1) ${delay}s, transform 600ms cubic-bezier(.2,.7,.3,1) ${delay}s`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${toneDot}`} />
        <span className="hud-label truncate">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`font-mono tabular text-lg sm:text-2xl font-semibold ${toneText}`}>{value}</span>
        <span className="text-[11px] sm:text-xs text-muted-foreground">{note}</span>
      </div>
    </div>
  );
}

function Satellite() {
  return (
    <svg
      viewBox="0 0 800 200"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orbitGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beamGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.65" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* orbit arc */}
      <path
        d="M 40 170 Q 400 -20 760 170"
        fill="none"
        stroke="url(#orbitGrad)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />

      {/* satellite traveling on orbit — CSS keyframes via offset-path */}
      <g
        style={{
          offsetPath: "path('M 40 170 Q 400 -20 760 170')",
          offsetRotate: 'auto',
          animation: 'satOrbit 9s linear infinite',
        }}
      >
        {/* beam down */}
        <path d="M 0 4 L -40 180 L 40 180 Z" fill="url(#beamGrad)" opacity="0.6" />
        {/* body */}
        <g filter="url(#glow)">
          <rect x="-9" y="-6" width="18" height="12" rx="2" fill="#e2e8f0" />
          <rect x="-22" y="-3" width="10" height="6" rx="1" fill="#38bdf8" />
          <rect x="12" y="-3" width="10" height="6" rx="1" fill="#38bdf8" />
          <circle cx="0" cy="0" r="2" fill="#f8fafc" />
        </g>
      </g>

      <style>
        {`@keyframes satOrbit {
          0%   { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }`}
      </style>
    </svg>
  );
}

function Stars() {
  const stars = useMemo(() => {
    const rng = mulberry32(7);
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      top: rng() * 55,
      left: rng() * 100,
      size: 0.5 + rng() * 1.5,
      opacity: 0.3 + rng() * 0.7,
      delay: rng() * 3,
    }));
  }, []);
  return (
    <>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `twinkle 3s ease-in-out ${s.delay}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0% {
            opacity: 0.2;
          }
          100% {
            opacity: 0.95;
          }
        }
      `}</style>
    </>
  );
}

function Hud() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* górny bar: lokalizacja */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 py-1.5 ring-1 ring-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-sky-100">
            LIVE · 52.31°N · 19.12°E
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 py-1.5 ring-1 ring-white/15">
          <span className="text-[11px] font-mono tracking-widest text-sky-100">
            Skan · 10 m / piksel
          </span>
        </div>
      </div>

    </div>
  );
}

// Deterministic PRNG — chcemy, żeby patches były stabilne przy każdym renderze
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
