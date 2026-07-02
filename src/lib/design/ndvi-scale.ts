// Kanoniczna skala NDVI — JEDNO źródło prawdy dla koloru zdrowia roślin.
// Wcześniej rampa istniała w 3 rozbieżnych kopiach z różnymi progami
// (SatelliteScanner, satellite/ndvi.ts, HistoryChart) — i jako kolor danych,
// i jako element brandu. Ta rampa jest sygnaturą wizualną AgriClaw.
//
// Stopnie dobrane spektralnie: goła ziemia (bordo) → stres (czerwień/pomarańcz)
// → przeciętny (żółć/limonka) → zdrowy (zieleń) → bujny (ciemna zieleń).

export interface RampStop {
  /** Próg NDVI w [-1, 1] */
  t: number;
  /** Kolor hex */
  hex: string;
  /** [r, g, b] 0-255 — do interpolacji i evalscriptów */
  rgb: [number, number, number];
}

export const NDVI_RAMP: RampStop[] = [
  { t: -0.2, hex: '#7f1d1d', rgb: [127, 29, 29] }, // goła ziemia / woda
  { t: 0.1, hex: '#dc2626', rgb: [220, 38, 38] }, // silny stres
  { t: 0.25, hex: '#f97316', rgb: [249, 115, 22] }, // stres
  { t: 0.4, hex: '#facc15', rgb: [250, 204, 21] }, // przeciętny
  { t: 0.55, hex: '#84cc16', rgb: [132, 204, 22] }, // dobry
  { t: 0.7, hex: '#16a34a', rgb: [22, 163, 74] }, // zdrowy
  { t: 0.85, hex: '#14532d', rgb: [20, 83, 45] }, // bujna biomasa
];

/** Lista hex stopni — do gradientów CSS (linear-gradient). */
export const NDVI_RAMP_HEX = NDVI_RAMP.map((s) => s.hex);

/** CSS linear-gradient (poziomy) dla paska-sygnatury rampy NDVI. */
export function ndviRampGradient(angle = '90deg'): string {
  const stops = NDVI_RAMP.map((s) => {
    const pct = Math.round(((s.t + 0.2) / 1.05) * 100); // -0.2..0.85 → 0..100%
    return `${s.hex} ${pct}%`;
  });
  return `linear-gradient(${angle}, ${stops.join(', ')})`;
}

/**
 * Ciągły (interpolowany) kolor dla wartości NDVI — używany zarówno do rasterów,
 * jak i do UI. Zwraca [r, g, b].
 */
export function ndviColorRgb(ndvi: number): [number, number, number] {
  if (Number.isNaN(ndvi)) return [31, 41, 55]; // szary dla nodata
  const v = Math.max(-1, Math.min(1, ndvi));
  if (v <= NDVI_RAMP[0].t) return NDVI_RAMP[0].rgb;
  const last = NDVI_RAMP[NDVI_RAMP.length - 1];
  if (v >= last.t) return last.rgb;
  for (let i = 0; i < NDVI_RAMP.length - 1; i++) {
    const a = NDVI_RAMP[i];
    const b = NDVI_RAMP[i + 1];
    if (v <= b.t) {
      const f = (v - a.t) / (b.t - a.t);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f),
      ];
    }
  }
  return last.rgb;
}

/** Kolor hex dla wartości NDVI (interpolowany). */
export function ndviColorHex(ndvi: number): string {
  const [r, g, b] = ndviColorRgb(ndvi);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Legenda rampy — do wyświetlenia paska z opisami. */
export const NDVI_LEGEND: Array<{ label: string; hex: string }> = [
  { label: 'goła ziemia', hex: '#7f1d1d' },
  { label: 'stres', hex: '#f97316' },
  { label: 'przeciętny', hex: '#facc15' },
  { label: 'zdrowy', hex: '#16a34a' },
  { label: 'bujny', hex: '#14532d' },
];
