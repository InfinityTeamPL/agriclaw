// NDVI utilities dla AgriClaw
// - computeNdviStats: statystyki z Float32Array (po rasterio extraction)
// - classifyNdvi: klasyfikacja zdrowotności uprawy w skali [0..1]
// - ndviColorHex: kolor do wizualizacji heatmapy na mapie

export interface NdviStats {
  mean: number;
  min: number;
  max: number;
  validCount: number;
  stddev: number;
}

/**
 * Oblicza statystyki NDVI pomijając NaN (nodata).
 * Przyjmuje Float32Array z wartościami NDVI w zakresie [-1, 1].
 */
export function computeNdviStats(values: Float32Array): NdviStats {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    sum += v;
    sumSq += v * v;
    count++;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  if (count === 0) {
    return { mean: 0, min: 0, max: 0, validCount: 0, stddev: 0 };
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  const stddev = Math.sqrt(Math.max(0, variance));

  return { mean, min, max, validCount: count, stddev };
}

export type NdviClass = 'bare' | 'stressed' | 'moderate' | 'healthy' | 'very-healthy';

/**
 * Klasyfikuje średni NDVI do czytelnego statusu rośliny.
 * Progi zgodne z typową interpretacją agronomiczną (USDA, ESA).
 */
export function classifyNdvi(ndviMean: number): NdviClass {
  if (ndviMean < 0.15) return 'bare'; // goła ziemia lub woda
  if (ndviMean < 0.35) return 'stressed'; // stres, susza, choroba
  if (ndviMean < 0.55) return 'moderate'; // średnia kondycja
  if (ndviMean < 0.75) return 'healthy'; // zdrowe rośliny
  return 'very-healthy'; // bardzo gęsta, zdrowa roślinność
}

/**
 * Kolor hex do wizualizacji NDVI na heatmapie.
 * Gradient od czerwieni (stres) przez żółty do zielonego.
 */
export function ndviColorHex(ndvi: number): string {
  if (Number.isNaN(ndvi)) return '#1f2937'; // szary dla nodata
  const clamped = Math.max(-1, Math.min(1, ndvi));

  if (clamped < 0.15) return '#7f1d1d'; // ciemny bordowy — goła ziemia
  if (clamped < 0.3) return '#dc2626'; // czerwony — silny stres
  if (clamped < 0.45) return '#f97316'; // pomarańczowy
  if (clamped < 0.55) return '#facc15'; // żółty
  if (clamped < 0.65) return '#84cc16'; // jasny zielony
  if (clamped < 0.75) return '#22c55e'; // zielony
  return '#14532d'; // ciemnozielony — bardzo zdrowy
}

export function describeNdvi(ndviMean: number, crop: string): string {
  const cls = classifyNdvi(ndviMean);
  const cropLabelMap: Record<string, string> = {
    wheat: 'pszenica',
    corn: 'kukurydza',
    rapeseed: 'rzepak',
    barley: 'jęczmień',
    potato: 'ziemniaki',
    other: 'uprawa',
  };
  const cropLabel = cropLabelMap[crop] ?? 'uprawa';

  switch (cls) {
    case 'bare':
      return `${cropLabel} ledwie widoczna — goła ziemia albo dopiero wschodzi`;
    case 'stressed':
      return `${cropLabel} pod wyraźnym stresem — susza, choroba lub niedobór składników`;
    case 'moderate':
      return `${cropLabel} w przeciętnej kondycji — monitoruj, możliwa interwencja`;
    case 'healthy':
      return `${cropLabel} zdrowa, w dobrej fazie wegetacji`;
    case 'very-healthy':
      return `${cropLabel} bujna, bardzo gęsta biomasa`;
  }
}
