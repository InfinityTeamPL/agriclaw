'use client';

// Panel 4 indeksów Sentinel-2 — NDVI, NDRE, NDWI, SAVI.
// Każdy z opisem agronomicznym i interpretacją dla danej wartości.

import { Sprout, Leaf, Droplets, MountainSnow, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndexValue {
  mean: number;
  min: number;
  max: number;
}

interface Props {
  ndvi: IndexValue;
  ndre: IndexValue | null;
  ndwi: IndexValue | null;
  savi: IndexValue | null;
  crop: string;
  // true = brak realnych danych CDSE. NDVI to mock, a NDRE/NDWI/SAVI liniowe
  // estymaty z niego — oznaczamy uczciwie, żeby nie udawać pomiaru satelitarnego.
  isMock?: boolean;
}

interface CardData {
  key: 'ndvi' | 'ndre' | 'ndwi' | 'savi';
  name: string;
  what: string;
  icon: typeof Sprout;
  accent: string;
  bg: string;
  ring: string;
  value: IndexValue | null;
  interpretation: string;
}

const isCereal = (crop: string) =>
  ['wheat', 'barley', 'rye', 'oats'].includes(crop);

function ndviInterp(v: number): string {
  if (v < 0.2) return 'Bardzo mała biomasa — goła gleba lub ściernisko';
  if (v < 0.35) return 'Stres: susza, choroba lub słaba kondycja';
  if (v < 0.55) return 'Średnia kondycja — obserwuj';
  if (v < 0.75) return 'Zdrowa, gęsta roślinność';
  return 'Bardzo bujna wegetacja';
}

function ndreInterp(v: number, crop: string): string {
  const cer = isCereal(crop);
  if (v < 0.2) {
    return cer
      ? 'Silny niedobór azotu — dokarm pilnie (mocznik 46% albo saletra amonowa 20 kg N/ha)'
      : 'Niski poziom azotu w roślinie';
  }
  if (v < 0.3) {
    return cer
      ? 'Azot graniczny — rozważ dokarmianie dolistne (mocznik 5%)'
      : 'Azot na dolnej granicy optimum';
  }
  if (v < 0.45) return 'Azot wystarczający na aktualnej fazie';
  return 'Dużo azotu — ryzyko wylegania, rozważ regulator wzrostu (CCC)';
}

function ndwiInterp(v: number): string {
  if (v < -0.1) return 'Silny stres wodny — liście zaczynają tracić wodę';
  if (v < 0) return 'Pod stresem wodnym, widać zaraz zwiędnięcie';
  if (v < 0.2) return 'Umiarkowana dostępność wody';
  return 'Dobre uwodnienie tkanek';
}

function saviInterp(savi: number, ndvi: number): string {
  const diff = savi - ndvi;
  if (diff > 0.08) {
    return 'SAVI wyraźnie wyższe niż NDVI — odsłonięta gleba zaniża NDVI, polegaj na SAVI';
  }
  if (savi < 0.2) return 'Mało biomasy — słabe wschody albo ściernisko';
  return 'SAVI zgodne z NDVI — pokrywa zielona dominuje';
}

function colorForValue(key: CardData['key'], v: number): string {
  if (key === 'ndvi') {
    if (v < 0.2) return '#7f1d1d';
    if (v < 0.35) return '#dc2626';
    if (v < 0.55) return '#f97316';
    if (v < 0.75) return '#84cc16';
    return '#14532d';
  }
  if (key === 'ndre') {
    if (v < 0.2) return '#dc2626';
    if (v < 0.3) return '#f97316';
    if (v < 0.45) return '#84cc16';
    return '#14532d';
  }
  if (key === 'ndwi') {
    if (v < -0.1) return '#dc2626';
    if (v < 0) return '#f97316';
    if (v < 0.2) return '#facc15';
    return '#0ea5e9';
  }
  // savi
  if (v < 0.2) return '#dc2626';
  if (v < 0.45) return '#f97316';
  if (v < 0.65) return '#84cc16';
  return '#14532d';
}

export function MultiIndexPanel({ ndvi, ndre, ndwi, savi, crop, isMock = false }: Props) {
  const cards: CardData[] = [
    {
      key: 'ndvi',
      name: 'NDVI',
      what: 'Ogólne zdrowie roślin',
      icon: Sprout,
      accent: 'text-signal-healthy',
      bg: 'bg-signal-healthy/10',
      ring: 'ring-signal-healthy/30',
      value: ndvi,
      interpretation: ndviInterp(ndvi.mean),
    },
    {
      key: 'ndre',
      name: 'NDRE',
      what: 'Niedobór azotu (Red Edge)',
      icon: Leaf,
      accent: 'text-signal-heat',
      bg: 'bg-signal-heat/10',
      ring: 'ring-signal-heat/30',
      value: ndre,
      interpretation: ndre ? ndreInterp(ndre.mean, crop) : '',
    },
    {
      key: 'ndwi',
      name: 'NDWI',
      what: 'Stres wodny w liściach',
      icon: Droplets,
      accent: 'text-signal-frost',
      bg: 'bg-signal-frost/10',
      ring: 'ring-signal-frost/30',
      value: ndwi,
      interpretation: ndwi ? ndwiInterp(ndwi.mean) : '',
    },
    {
      key: 'savi',
      name: 'SAVI',
      what: 'Biomasa skorygowana o glebę',
      icon: MountainSnow,
      accent: 'text-muted-foreground',
      bg: 'bg-secondary',
      ring: 'ring-border',
      value: savi,
      interpretation: savi ? saviInterp(savi.mean, ndvi.mean) : '',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">
          {isMock
            ? 'Dane demo — brak zdjęcia satelitarnego (Copernicus nieskonfigurowany). Wartości orientacyjne, nie pomiar.'
            : 'Wszystkie indeksy z jednego zdjęcia Sentinel-2 (10 m/piksel)'}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const hasValue = c.value !== null;
          const color = hasValue ? colorForValue(c.key, c.value!.mean) : '#94a3b8';
          return (
            <div
              key={c.key}
              className={cn(
                'rounded-lg bg-card border border-border shadow-card p-4 space-y-2 transition hover:shadow-pop',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded-md ring-1',
                    c.bg,
                    c.ring,
                  )}
                >
                  <Icon className={cn('w-4 h-4', c.accent)} />
                </div>
                <div className="flex flex-col items-end text-right">
                  <div className="hud-label">
                    {c.name}
                  </div>
                  <div
                    className="text-2xl font-bold font-mono tabular"
                    style={{ color }}
                  >
                    {hasValue ? c.value!.mean.toFixed(2) : '–'}
                  </div>
                  {isMock && hasValue && (
                    <span
                      className="hud-label mt-1 inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 text-muted-foreground"
                      title="Wartość orientacyjna — brak zdjęcia satelitarnego (Copernicus nieskonfigurowany). To nie jest pomiar."
                    >
                      dane demo
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs font-semibold text-foreground">{c.what}</div>
              {hasValue && (
                <>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono tabular">
                    min {c.value!.min.toFixed(2)} · max {c.value!.max.toFixed(2)}
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden bg-secondary"
                    title={`Min ${c.value!.min.toFixed(2)} — Max ${c.value!.max.toFixed(2)}`}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, Math.max(5, (c.value!.mean + 0.2) * 100 / 1.2))}%`,
                        background: `linear-gradient(90deg, ${color}aa, ${color})`,
                      }}
                    />
                  </div>
                </>
              )}
              {c.interpretation && (
                <div className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {c.interpretation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
