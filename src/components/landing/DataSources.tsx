'use client';

import {
  Satellite,
  Radar,
  Thermometer,
  CloudSun,
  FileCheck2,
  Sprout,
} from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

// Nazwane, sprawdzalne źródła — jury (CASSINI/Copernicus, AGROSTRATEG) pyta
// „skąd te dane?". Każdy wpis ma realny odpowiednik w kodzie (lib/satellite, lib/sor-registry, lib/bbch).
const ITEMS = [
  {
    icon: Satellite,
    title: 'Sentinel-2 · 10 m',
    source: 'Copernicus · ESA',
    desc: 'Zdrowie roślin (NDVI), azot w liściach (NDRE), woda w roślinie (NDWI). Nowe zdjęcie co 2–5 dni.',
  },
  {
    icon: Radar,
    title: 'Sentinel-1 · radar',
    source: 'Copernicus · ESA',
    desc: 'Radar widzi przez chmury. Gdy pada tydzień, i tak wiesz, co dzieje się na polu.',
  },
  {
    icon: Thermometer,
    title: 'Landsat · termika',
    source: 'NASA / USGS',
    desc: 'Temperatura powierzchni pola — przegrzanie i stres wodny widać, zanim liście zżółkną.',
  },
  {
    icon: CloudSun,
    title: 'Pogoda godzinowa',
    source: 'Open-Meteo · modele ECMWF/ICON',
    desc: 'Opad, wiatr, przymrozek i parowanie (ET₀) na 7 dni — liczone dla współrzędnych Twojego pola.',
  },
  {
    icon: FileCheck2,
    title: 'Rejestr ŚOR',
    source: 'MRiRW · dane.gov.pl',
    desc: 'Aktualna lista dopuszczonych środków i terminy wycofań. Odświeżana automatycznie co tydzień.',
  },
  {
    icon: Sprout,
    title: 'Fazy rozwojowe BBCH',
    source: 'Model sum temperatur (GDD)',
    desc: 'Z daty siewu i temperatur liczymy fazę rośliny — stąd wiemy, kiedy nawozić i kiedy grozi choroba.',
  },
];

export function DataSources() {
  return (
    <section className="relative py-20 overflow-hidden bg-secondary">
      {/* Tło: siatka kartograficzna zamiast dekoracyjnego radialnego blobu */}
      <div className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="mb-12 text-center">
          {/* Eyebrow jako odczyt HUD — nie badge z pillem */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
            <span className="hud-label">Skąd bierzemy dane</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Otwarte dane, sprawdzalne źródła —
            <br className="hidden sm:block" />
            <span className="relative inline-block pb-3 text-foreground">
              Ty widzisz tylko gotową odpowiedź.
              {/* Rampa NDVI jako sygnatura marki, zamiast gradient-textu */}
              <NdviKeyline className="absolute -bottom-0.5 left-0" height={4} />
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-lg bg-card border border-border p-6 shadow-card hover:border-foreground/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-secondary border border-border mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-display font-semibold text-lg tracking-tight text-foreground">
                  {s.title}
                </div>
                <div className="hud-label mt-1 mb-2.5">{s.source}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
