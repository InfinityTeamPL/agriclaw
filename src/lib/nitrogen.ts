// Kalkulator azotu (N) — rekomendacja dawki kg N/ha na podstawie:
//  1. Uprawa (wheat, rapeseed, corn, potato, ...) + celowy plon
//  2. BBCH stage (okno aplikacji: N1 startowy, N2 liść flagowy, N3 dolistny)
//  3. NDRE (Normalized Difference Red Edge) — wskaźnik zawartości azotu w liściach
//  4. Powierzchnia pola → całkowita dawka kg N
//
// Metodyka: sensor-based N recommendation (Raun 2005, Holland-Schepers 2010).
// NDRE jest 3-5× czulsze od NDVI dla N w zbożach po BBCH 30.
//
// Formuła bazowa:
//   N_dose = N_baseline × adjustment(NDRE, crop, bbch)
// gdzie adjustment ∈ [0.5, 1.5] — redukujemy do 50% albo zwiększamy do 150% dawki książkowej.

import type { Crop } from './bbch';

export type NApplicationWindow = 'N1-start' | 'N2-flag-leaf' | 'N3-foliar' | 'out-of-window';

export interface NRecommendation {
  crop: Crop;
  bbch: number;
  areaHectares: number;
  /** Aktualne okno aplikacji — 'out-of-window' jeśli BBCH poza zakresem. */
  window: NApplicationWindow;
  windowLabel: string; // PL
  /** Dawka rekomendowana kg N/ha. */
  doseKgNPerHa: number;
  /** Dawka książkowa bez korekty NDRE. */
  baselineKgNPerHa: number;
  /** Korekta % vs baseline (-100 do +50). */
  adjustmentPct: number;
  /** NDRE który wykorzystano (null jeśli nie było analizy). */
  ndreUsed: number | null;
  /** Uzasadnienie rekomendacji (pl). */
  reasoning: string;
  /** Ile to saletry amonowej 34% N (kg/ha). */
  saletra34Kg: number;
  /** Ile to mocznika 46% N (kg/ha). */
  mocznik46Kg: number;
  /** Szacowany koszt zł/ha (średni nawóz). */
  costPlnPerHa: number;
  /** Całkowity koszt dla pola zł. */
  totalCostPln: number;
  /** Całkowita dawka dla pola kg N. */
  totalKgN: number;
  /** Oszczędność vs dawka książkowa (kg N + zł). Dodatnie = oszczędność. */
  savingVsBaseline: { kgN: number; pln: number } | null;
}

interface CropNProfile {
  baselineN1: number; // kg N/ha startowa dawka
  baselineN2: number; // kg N/ha na liść flagowy (zboża) lub strzelanie (rzepak)
  baselineN3: number; // kg N/ha dolistna (lub foliar)
  n1Window: [number, number]; // [bbchMin, bbchMax]
  n2Window: [number, number];
  n3Window: [number, number];
  /** Optymalne NDRE w oknie N1/N2 — jeśli NDRE jest wyższy, rolina ma wystarczająco N. */
  optimalNdre: { n1: number; n2: number };
  targetYieldTHa: number; // cel plonu t/ha
  nPerTon: number; // kg N potrzebne na tonę plonu
}

const PROFILES: Partial<Record<Crop, CropNProfile>> = {
  wheat: {
    baselineN1: 50,
    baselineN2: 70,
    baselineN3: 30,
    n1Window: [25, 31],
    n2Window: [32, 39],
    n3Window: [49, 59],
    optimalNdre: { n1: 0.35, n2: 0.42 },
    targetYieldTHa: 7,
    nPerTon: 26,
  },
  barley: {
    baselineN1: 40,
    baselineN2: 50,
    baselineN3: 25,
    n1Window: [25, 31],
    n2Window: [32, 39],
    n3Window: [49, 55],
    optimalNdre: { n1: 0.33, n2: 0.40 },
    targetYieldTHa: 6,
    nPerTon: 22,
  },
  rye: {
    baselineN1: 40,
    baselineN2: 50,
    baselineN3: 25,
    n1Window: [25, 31],
    n2Window: [32, 39],
    n3Window: [49, 55],
    optimalNdre: { n1: 0.32, n2: 0.38 },
    targetYieldTHa: 5,
    nPerTon: 22,
  },
  oats: {
    baselineN1: 40,
    baselineN2: 45,
    baselineN3: 20,
    n1Window: [25, 31],
    n2Window: [32, 39],
    n3Window: [49, 55],
    optimalNdre: { n1: 0.32, n2: 0.38 },
    targetYieldTHa: 5,
    nPerTon: 20,
  },
  rapeseed: {
    baselineN1: 90,
    baselineN2: 70,
    baselineN3: 40,
    n1Window: [30, 50],
    n2Window: [50, 59],
    n3Window: [60, 69],
    optimalNdre: { n1: 0.30, n2: 0.38 },
    targetYieldTHa: 4,
    nPerTon: 60,
  },
  corn: {
    baselineN1: 80,
    baselineN2: 100,
    baselineN3: 30,
    n1Window: [0, 15], // przedsiewny / starter
    n2Window: [16, 39], // pogłownie przy 6-12 liści
    n3Window: [40, 60],
    optimalNdre: { n1: 0.25, n2: 0.35 },
    targetYieldTHa: 10,
    nPerTon: 20,
  },
  potato: {
    baselineN1: 120,
    baselineN2: 60,
    baselineN3: 20,
    n1Window: [0, 10],
    n2Window: [20, 49],
    n3Window: [50, 69],
    optimalNdre: { n1: 0.30, n2: 0.40 },
    targetYieldTHa: 45,
    nPerTon: 4,
  },
  sugarbeet: {
    baselineN1: 100,
    baselineN2: 60,
    baselineN3: 20,
    n1Window: [0, 15],
    n2Window: [15, 39],
    n3Window: [40, 49],
    optimalNdre: { n1: 0.28, n2: 0.38 },
    targetYieldTHa: 65,
    nPerTon: 2.5,
  },
};

// Cena średnia 2026: 3.80 zł za 1 kg czystego N (mix nawozów). Użytkownik może podać własną.
const DEFAULT_N_PRICE_PLN_PER_KG = 3.8;

function detectWindow(profile: CropNProfile, bbch: number): NApplicationWindow {
  if (bbch >= profile.n1Window[0] && bbch <= profile.n1Window[1]) return 'N1-start';
  if (bbch >= profile.n2Window[0] && bbch <= profile.n2Window[1]) return 'N2-flag-leaf';
  if (bbch >= profile.n3Window[0] && bbch <= profile.n3Window[1]) return 'N3-foliar';
  return 'out-of-window';
}

function windowLabelFor(crop: Crop, window: NApplicationWindow): string {
  if (window === 'out-of-window') return 'Poza oknem N — brak rekomendacji dawki';
  const isCereal = crop === 'wheat' || crop === 'barley' || crop === 'rye' || crop === 'oats';
  if (isCereal) {
    if (window === 'N1-start') return 'N1 — azot startowy na ruszenie wegetacji';
    if (window === 'N2-flag-leaf') return 'N2 — azot na liść flagowy';
    return 'N3 — azot dolistny (mocznik 5%)';
  }
  if (crop === 'rapeseed') {
    if (window === 'N1-start') return 'N1 — azot wiosenny po ruszeniu';
    if (window === 'N2-flag-leaf') return 'N2 — azot przed kwitnieniem';
    return 'N3 — foliar przy kwitnieniu';
  }
  if (crop === 'corn') {
    if (window === 'N1-start') return 'N1 — starter (przedsiewny / startowy)';
    if (window === 'N2-flag-leaf') return 'N2 — pogłowne przy 6-12 liści';
    return 'N3 — korekta późna';
  }
  if (crop === 'potato') {
    if (window === 'N1-start') return 'N1 — przed sadzeniem';
    if (window === 'N2-flag-leaf') return 'N2 — pogłowne przy obsypywaniu';
    return 'N3 — dolistny';
  }
  return window;
}

function baselineFor(profile: CropNProfile, window: NApplicationWindow): number {
  if (window === 'N1-start') return profile.baselineN1;
  if (window === 'N2-flag-leaf') return profile.baselineN2;
  if (window === 'N3-foliar') return profile.baselineN3;
  return 0;
}

function ndreAdjustment(
  profile: CropNProfile,
  window: NApplicationWindow,
  ndre: number | null,
): { factor: number; reasoning: string } {
  if (ndre === null || window === 'out-of-window') {
    return {
      factor: 1,
      reasoning: 'Brak pomiaru NDRE z Sentinel-2 — stosujemy dawkę książkową.',
    };
  }
  const optimal = window === 'N1-start' ? profile.optimalNdre.n1 : profile.optimalNdre.n2;
  // Im niższe NDRE vs optimal, tym WIĘKSZY niedobór → zwiększ dawkę.
  // Im wyższe NDRE, tym większy luksus → ZMNIEJSZ dawkę (ryzyko wylegania + koszt).
  const delta = optimal - ndre; // dodatnie = niedobór
  // Skalowanie: każde 0.1 różnicy NDRE = 25% korekty dawki.
  const factor = 1 + delta * 2.5;
  const clamped = Math.max(0.5, Math.min(1.5, factor));

  let reasoning: string;
  if (ndre >= optimal + 0.05) {
    reasoning = `NDRE ${ndre.toFixed(2)} powyżej optimum ${optimal.toFixed(2)} — roślina ma azot w zapasie, redukujemy dawkę o ${Math.round((1 - clamped) * 100)}% (ochrona przed wyleganiem + oszczędność).`;
  } else if (ndre <= optimal - 0.05) {
    reasoning = `NDRE ${ndre.toFixed(2)} poniżej optimum ${optimal.toFixed(2)} — niedobór azotu, zwiększamy dawkę o ${Math.round((clamped - 1) * 100)}%.`;
  } else {
    reasoning = `NDRE ${ndre.toFixed(2)} ~ optimum ${optimal.toFixed(2)} — roślina ma adekwatny azot, dawka książkowa wystarczy.`;
  }

  return { factor: clamped, reasoning };
}

export interface NInput {
  crop: Crop;
  bbch: number;
  areaHectares: number;
  /** Aktualne NDRE z ostatniej analizy Sentinel-2 (null jeśli brak). */
  ndre: number | null;
  /** Opcjonalnie — cena 1 kg czystego N w zł. Domyślnie 3.80 zł. */
  pricePerKgN?: number;
}

export function calculateNitrogen(input: NInput): NRecommendation | null {
  const profile = PROFILES[input.crop];
  if (!profile) return null;

  const window = detectWindow(profile, input.bbch);
  const baseline = baselineFor(profile, window);

  if (window === 'out-of-window' || baseline === 0) {
    return {
      crop: input.crop,
      bbch: input.bbch,
      areaHectares: input.areaHectares,
      window,
      windowLabel: windowLabelFor(input.crop, window),
      doseKgNPerHa: 0,
      baselineKgNPerHa: 0,
      adjustmentPct: 0,
      ndreUsed: input.ndre,
      reasoning: `BBCH ${input.bbch} — roślina nie jest w oknie aplikacji azotu. Najbliższe okno: N1 ${profile.n1Window[0]}-${profile.n1Window[1]}, N2 ${profile.n2Window[0]}-${profile.n2Window[1]}.`,
      saletra34Kg: 0,
      mocznik46Kg: 0,
      costPlnPerHa: 0,
      totalCostPln: 0,
      totalKgN: 0,
      savingVsBaseline: null,
    };
  }

  const { factor, reasoning } = ndreAdjustment(profile, window, input.ndre);
  const dose = Math.round(baseline * factor);
  const price = input.pricePerKgN ?? DEFAULT_N_PRICE_PLN_PER_KG;

  const saletra34Kg = Math.round(dose / 0.34);
  const mocznik46Kg = Math.round(dose / 0.46);
  const costPlnPerHa = Math.round(dose * price);
  const totalCostPln = Math.round(costPlnPerHa * input.areaHectares);
  const totalKgN = Math.round(dose * input.areaHectares);

  const savedKgN = baseline - dose;
  const saving =
    savedKgN !== 0
      ? { kgN: savedKgN, pln: Math.round(savedKgN * price * input.areaHectares) }
      : null;

  return {
    crop: input.crop,
    bbch: input.bbch,
    areaHectares: input.areaHectares,
    window,
    windowLabel: windowLabelFor(input.crop, window),
    doseKgNPerHa: dose,
    baselineKgNPerHa: baseline,
    adjustmentPct: Math.round((factor - 1) * 100),
    ndreUsed: input.ndre,
    reasoning,
    saletra34Kg,
    mocznik46Kg,
    costPlnPerHa,
    totalCostPln,
    totalKgN,
    savingVsBaseline: saving,
  };
}
