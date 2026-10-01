// NDVI utilities dla AgriClaw
// - computeNdviStats: statystyki z Float32Array (po rasterio extraction)
// - classifyNdvi: klasyfikacja zdrowotności uprawy w skali [0..1]
// - ndviColorHex: kolor do wizualizacji heatmapy na mapie

import { resolveSowingDate, type Crop } from '@/lib/bbch';

/**
 * Faza uprawy istotna dla INTERPRETACJI indeksów (nie pełne BBCH):
 * - establishment — wschody/ukorzenianie: dużo widocznej gleby, NDVI 0,2–0,5 to norma,
 * - dormancy — spoczynek zimowy ozimin (XII–II): niski NDVI jest normalny,
 * - growth — reszta sezonu: progi klasyczne.
 * Bez tego pszenica 2 tyg. po siewie (NDVI 0,46) dostawała „przeciętna kondycja —
 * możliwa interwencja" i radę dolistnego azotu w październiku (10.2026).
 */
export type CropStage = 'establishment' | 'dormancy' | 'growth';

export interface CropStageCtx {
  sowingDate?: Date | string | null;
  at?: Date;
}

export function cropStage(crop: string, ctx: CropStageCtx = {}): CropStage {
  const at = ctx.at ?? new Date();
  const { sowingDate } = resolveSowingDate(ctx.sowingDate, crop as Crop, at);
  const days = (at.getTime() - sowingDate.getTime()) / 86_400_000;
  const sownInAutumn = sowingDate.getUTCMonth() >= 7 && sowingDate.getUTCMonth() <= 10; // VIII–XI
  const month = at.getUTCMonth(); // 0 = styczeń
  if (sownInAutumn && (month === 11 || month <= 1) && days > 0) return 'dormancy';
  // Ozimina rośnie jesienią wolno — faza wschodów trwa do zimy; jare ~5 tygodni.
  if (days >= 0 && days < (sownInAutumn ? 75 : 35)) return 'establishment';
  return 'growth';
}

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

export function describeNdvi(ndviMean: number, crop: string, ctx?: CropStageCtx): string {
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

  if (ctx) {
    const stage = cropStage(crop, ctx);
    if (stage === 'dormancy') {
      return `${cropLabel} w spoczynku zimowym — niski NDVI zimą jest normalny; przezimowanie ocenimy po ruszeniu wegetacji`;
    }
    if (stage === 'establishment' && cls !== 'healthy' && cls !== 'very-healthy') {
      return cls === 'bare'
        ? `${cropLabel} dopiero wschodzi — w odczycie dominuje gleba; obsadę roślin sprawdź w polu ok. 3 tygodnie po siewie`
        : `${cropLabel} we wschodach — NDVI typowy dla tej fazy (gleba jeszcze widoczna między rzędami)`;
    }
  }

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
