// Wilgotność gleby z Sentinel-1 (radar C-band) metodą detekcji zmian.
//
// DLACZEGO TO, A NIE SMAP: natywny SMAP ma 9–36 km na piksel (81 km² = setki
// pól), a nawet fuzja Sentinel-1/SMAP to 3 km — bezużyteczne per-pole. Sentinel-1
// daje odczyt na poziomie pola (~15 m) i w badaniach bije SMAP/SMOS na RMSE.
// Dane S1 i tak już pobieramy do radaru — to najtańszy realny pomiar wilgotności.
//
// METODA (TUWCD-like change detection):
// Backscatter VV rośnie wraz z wilgotnością gleby (stała dielektryczna). Nie znamy
// jednak absolutnej zależności bez kalibracji per-glebę, więc odnosimy bieżący
// odczyt do WŁASNEJ historii pola: sucho = niski percentyl, mokro = wysoki.
// Wynik to pozycja w zakresie sucho–mokro TEGO pola, nie m³/m³.
//
// UCZCIWOŚĆ (zasada produktu „nie udawaj pomiaru"): zwracamy wskaźnik WZGLĘDNY
// 0–100% + jawną pewność. Badania: ubRMSE ~0,07 m³/m³ przy korekcie wegetacji,
// ale zmienne per-pole (0,05 do >0,12) i degradujące się pod gęstym łanem —
// dlatego to sygnał trendu, nie liczba do podlewania z aptekarską dokładnością.
//
// Źródła: Baghdadi 2017 (MDPI Sensors), Agric. Water Manag. 2023 (TUWCD/MTBCD),
// PMC12115452 (2025). Patrz docs/research/satelity-i-teledetekcja-2026.md.

/** Minimalna liczba obserwacji, by percentyle sucho/mokro miały sens. */
export const MIN_HISTORY_FOR_REFERENCE = 8;

/** Poniżej tego rozstępu (dB) pole nie ma dynamiki — referencje niewiarygodne. */
export const MIN_DYNAMIC_RANGE_DB = 2;

/** Powyżej tego NDVI łan dominuje sygnał radarowy — gleba słabo widoczna. */
export const DENSE_CANOPY_NDVI = 0.6;

export type MoistureConfidence = 'high' | 'medium' | 'low';

export interface SoilMoistureS1 {
  /** Pozycja w zakresie sucho–mokro TEGO pola (0 = najsuchsze w historii, 100 = najwilgotniejsze). */
  relativePct: number;
  confidence: MoistureConfidence;
  /** Powody obniżonej pewności — pokazywane rolnikowi wprost. */
  caveats: string[];
  /** Ile obserwacji historycznych stoi za referencjami. */
  sampleCount: number;
  /** Referencje w dB — do diagnostyki i wykresu. */
  dryRefDb: number;
  wetRefDb: number;
  method: 'change-detection-vv';
}

/** Percentyl z posortowanej tablicy (interpolacja liniowa). */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Liczy względną wilgotność gleby z backscatteru VV względem historii pola.
 *
 * @param currentVvDb bieżący średni backscatter VV pola [dB]
 * @param historyVvDb historyczne średnie VV tego pola [dB] (bez bieżącego)
 * @param currentNdvi bieżące NDVI pola (korekta wegetacji); null = nieznane
 * @returns null gdy nie da się policzyć sensownie (za mało historii / brak dynamiki)
 */
export function computeSoilMoistureS1(
  currentVvDb: number,
  historyVvDb: number[],
  currentNdvi: number | null,
): SoilMoistureS1 | null {
  if (!Number.isFinite(currentVvDb)) return null;

  const clean = historyVvDb.filter((v) => Number.isFinite(v));
  if (clean.length < MIN_HISTORY_FOR_REFERENCE) return null;

  const sorted = [...clean].sort((a, b) => a - b);
  const dryRefDb = percentile(sorted, 0.05);
  const wetRefDb = percentile(sorted, 0.95);
  const range = wetRefDb - dryRefDb;

  // Pole bez dynamiki backscatteru (np. stale mokre/zabudowane) — referencje
  // bezwartościowe, a wynik byłby losowym szumem podanym jako pomiar.
  if (!(range >= MIN_DYNAMIC_RANGE_DB)) return null;

  const raw = ((currentVvDb - dryRefDb) / range) * 100;
  const relativePct = Math.round(Math.max(0, Math.min(100, raw)));

  const caveats: string[] = [];
  let confidence: MoistureConfidence = 'high';

  // Gęsty łan: sygnał odbija się od roślin, nie od gleby.
  if (currentNdvi !== null && currentNdvi > DENSE_CANOPY_NDVI) {
    confidence = 'low';
    caveats.push('Gęsty łan (NDVI > 0,6) — radar słabo widzi glebę pod roślinami.');
  }

  // Krótka historia = niestabilne percentyle.
  if (clean.length < MIN_HISTORY_FOR_REFERENCE * 2) {
    confidence = confidence === 'low' ? 'low' : 'medium';
    caveats.push(`Krótka historia radarowa (${clean.length} obserwacji) — referencje mogą się jeszcze przesunąć.`);
  }

  // Wąski zakres = mała rozdzielczość rozróżniania sucho/mokro.
  if (range < MIN_DYNAMIC_RANGE_DB * 2) {
    confidence = confidence === 'low' ? 'low' : 'medium';
    caveats.push('Wąski zakres sucho–mokro na tym polu — odczyt mniej rozdzielczy.');
  }

  // Odczyt poza historycznym zakresem — ekstremum, referencje do przeliczenia.
  if (currentVvDb > wetRefDb || currentVvDb < dryRefDb) {
    caveats.push('Odczyt poza dotychczasowym zakresem pola — wartość przycięta do 0/100%.');
  }

  return {
    relativePct,
    confidence,
    caveats,
    sampleCount: clean.length,
    dryRefDb: Number(dryRefDb.toFixed(2)),
    wetRefDb: Number(wetRefDb.toFixed(2)),
    method: 'change-detection-vv',
  };
}

/** Opis słowny dla rolnika — zawsze względny, nigdy jako m³/m³. */
export function describeSoilMoistureS1(m: SoilMoistureS1): string {
  const scale =
    m.relativePct >= 75
      ? 'wyraźnie wilgotniej niż zwykle'
      : m.relativePct >= 55
        ? 'wilgotniej niż przeciętnie'
        : m.relativePct >= 35
          ? 'w okolicy typowej dla tego pola'
          : m.relativePct >= 20
            ? 'sucho jak na to pole'
            : 'najsuszej w obserwowanej historii';
  return `Wilgotność gleby (radar): ${m.relativePct}% zakresu sucho–mokro tego pola — ${scale}.`;
}
