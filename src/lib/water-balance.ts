// Water balance (bilans wodny pola) — FAO-56 metodologia.
// Liczymy:
//  ETc[dzień] = ET0[dzień] × Kc(BBCH, uprawa)  — ile rośłina wyparowała
//  Balance[dzień] = Rain[dzień] - ETc[dzień]   — netto mm/dzień
//  Cumulative balance = suma wejść/wyjść w oknie 7-30 dni
//
// Klucz: Kc (crop coefficient) zmienia się w czasie wegetacji.
// Pszenica: Kc=0.4 przy wschodach → 1.15 w kwitnieniu → 0.4 przy dojrzałości.
// FAO-56: https://www.fao.org/4/x0490e/x0490e00.htm

import type { Crop } from './bbch';

interface KcCurve {
  /** Współczynnik Kc podczas wschodów i wczesnego wzrostu. */
  kcIni: number;
  /** Kc w pełnym rozwoju (peak LAI). */
  kcMid: number;
  /** Kc w dojrzewaniu. */
  kcEnd: number;
  /** BBCH przy którym przechodzi z kcIni do kcMid (interpolacja). */
  bbchToMid: number;
  /** BBCH przy którym zaczyna się zanik do kcEnd. */
  bbchToEnd: number;
  /** BBCH, przy którym osiąga kcEnd. */
  bbchFullEnd: number;
}

const KC: Record<Crop, KcCurve> = {
  wheat:     { kcIni: 0.4,  kcMid: 1.15, kcEnd: 0.4,  bbchToMid: 40, bbchToEnd: 70, bbchFullEnd: 89 },
  barley:    { kcIni: 0.3,  kcMid: 1.15, kcEnd: 0.25, bbchToMid: 40, bbchToEnd: 70, bbchFullEnd: 89 },
  rye:       { kcIni: 0.3,  kcMid: 1.10, kcEnd: 0.3,  bbchToMid: 40, bbchToEnd: 70, bbchFullEnd: 89 },
  oats:      { kcIni: 0.3,  kcMid: 1.10, kcEnd: 0.25, bbchToMid: 40, bbchToEnd: 70, bbchFullEnd: 89 },
  rapeseed:  { kcIni: 0.35, kcMid: 1.15, kcEnd: 0.35, bbchToMid: 50, bbchToEnd: 75, bbchFullEnd: 89 },
  corn:      { kcIni: 0.3,  kcMid: 1.20, kcEnd: 0.35, bbchToMid: 50, bbchToEnd: 75, bbchFullEnd: 89 },
  potato:    { kcIni: 0.5,  kcMid: 1.15, kcEnd: 0.75, bbchToMid: 40, bbchToEnd: 85, bbchFullEnd: 97 },
  sugarbeet: { kcIni: 0.35, kcMid: 1.20, kcEnd: 0.70, bbchToMid: 40, bbchToEnd: 49, bbchFullEnd: 99 },
  other:     { kcIni: 0.4,  kcMid: 1.00, kcEnd: 0.4,  bbchToMid: 40, bbchToEnd: 70, bbchFullEnd: 89 },
};

export function kcAtBbch(crop: Crop, bbch: number): number {
  const curve = KC[crop] ?? KC.other;
  if (bbch <= 0) return curve.kcIni;
  if (bbch <= curve.bbchToMid) {
    // Interpoluj kcIni → kcMid
    const t = bbch / curve.bbchToMid;
    return curve.kcIni + (curve.kcMid - curve.kcIni) * t;
  }
  if (bbch <= curve.bbchToEnd) {
    return curve.kcMid;
  }
  if (bbch <= curve.bbchFullEnd) {
    // Interpoluj kcMid → kcEnd
    const t = (bbch - curve.bbchToEnd) / (curve.bbchFullEnd - curve.bbchToEnd);
    return curve.kcMid + (curve.kcEnd - curve.kcMid) * t;
  }
  return curve.kcEnd;
}

export interface DailyBalance {
  date: string;
  rainMm: number;
  et0Mm: number;
  kc: number;
  etcMm: number;
  balanceMm: number; // dodatnie = zysk, ujemne = strata
  cumulativeMm: number; // bilans skumulowany od początku okna
}

export interface WaterBalanceResult {
  crop: Crop;
  bbch: number;
  kcCurrent: number;
  /** Okres obejmujący bilans. */
  periodDays: number;
  /** Suma opadów w oknie (mm). */
  totalRainMm: number;
  /** Suma ETc — ewapotranspiracja roślin w oknie (mm). */
  totalEtcMm: number;
  /** Netto bilans (rain - ETc) w mm. Ujemne = deficyt. */
  netBalanceMm: number;
  /** Tablica dni z wartościami dzień-po-dniu + cumulative. */
  daily: DailyBalance[];
  /** Ocena słowna. */
  status: 'surplus' | 'balanced' | 'mild-deficit' | 'drought' | 'severe-drought';
  /** Sugerowana dawka nawodnienia w mm (0 jeśli niepotrzebna). */
  irrigationSuggestionMm: number;
  /** Ile m³ wody na pole. */
  irrigationTotalM3: number;
  /** Rekomendacja słowna (pl). */
  recommendation: string;
}

export interface WaterBalanceInput {
  crop: Crop;
  bbch: number;
  areaHectares: number;
  /** Tablica dni { date, rainMm, et0Mm } — uporządkowane chronologicznie. */
  days: Array<{ date: string; rainMm: number; et0Mm: number }>;
}

export function calculateWaterBalance(input: WaterBalanceInput): WaterBalanceResult {
  const kcCurrent = kcAtBbch(input.crop, input.bbch);

  let cumulative = 0;
  let totalRain = 0;
  let totalEtc = 0;
  const daily: DailyBalance[] = input.days.map((d) => {
    const etc = d.et0Mm * kcCurrent;
    const balance = d.rainMm - etc;
    cumulative += balance;
    totalRain += d.rainMm;
    totalEtc += etc;
    return {
      date: d.date,
      rainMm: d.rainMm,
      et0Mm: d.et0Mm,
      kc: kcCurrent,
      etcMm: etc,
      balanceMm: balance,
      cumulativeMm: cumulative,
    };
  });

  const netBalance = totalRain - totalEtc;
  const periodDays = daily.length;

  // Klasyfikacja statusu — średnio per dzień deficytu
  const avgDailyDeficit = periodDays > 0 ? netBalance / periodDays : 0;
  let status: WaterBalanceResult['status'];
  if (avgDailyDeficit > 1) status = 'surplus';
  else if (avgDailyDeficit > -1) status = 'balanced';
  else if (avgDailyDeficit > -2.5) status = 'mild-deficit';
  else if (avgDailyDeficit > -4) status = 'drought';
  else status = 'severe-drought';

  // Sugerowana dawka = połowa deficytu (nie dopełniamy 100%, bo wciąż spodziewamy się jakichś opadów)
  const irrigationSuggestion =
    netBalance < -10 ? Math.round(-netBalance * 0.6) : 0;
  const irrigationTotalM3 = Math.round(irrigationSuggestion * input.areaHectares * 10); // 1 mm = 10 m³/ha

  let recommendation: string;
  if (status === 'surplus') {
    recommendation = `Bilans dodatni (+${netBalance.toFixed(1)} mm w ${periodDays} dni). Gleba ma zapas wody — nawodnienie niepotrzebne. Obserwuj NDWI pod kątem zbyt wilgotnych stref.`;
  } else if (status === 'balanced') {
    recommendation = `Bilans wyrównany (${netBalance.toFixed(1)} mm w ${periodDays} dni). Roślina otrzymuje tyle ile zużywa — przez najbliższy tydzień nie trzeba podlewać.`;
  } else if (status === 'mild-deficit') {
    recommendation = `Umiarkowany deficyt (${netBalance.toFixed(1)} mm w ${periodDays} dni). ETc ${totalEtc.toFixed(0)} mm, opady ${totalRain.toFixed(0)} mm. Monitoruj NDWI; jeśli nie będzie deszczu w 5-7 dni, rozważ nawodnienie ${irrigationSuggestion} mm (${irrigationTotalM3} m³ na polu).`;
  } else if (status === 'drought') {
    recommendation = `SUSZA (${netBalance.toFixed(1)} mm w ${periodDays} dni). Kc=${kcCurrent.toFixed(2)} × ET0 ${(totalEtc / kcCurrent).toFixed(0)} mm. Roślina zużywa ${(totalEtc / periodDays).toFixed(1)} mm/dzień, dostaje ${(totalRain / periodDays).toFixed(1)} mm/dzień. Nawodnienie ${irrigationSuggestion} mm (${irrigationTotalM3} m³ na polu) — najlepiej wieczorem / rano przy niskim ET.`;
  } else {
    recommendation = `SILNA SUSZA (${netBalance.toFixed(1)} mm w ${periodDays} dni). Realne straty plonu wiąż jeśli nie zainterweniujesz. Nawodnienie awaryjne ${irrigationSuggestion} mm (${irrigationTotalM3} m³ na polu). Jeśli nie masz nawadniania — rozważ redukcję dawki azotu (stres roślina nie wykorzysta N) i przygotuj się na obniżony plon.`;
  }

  return {
    crop: input.crop,
    bbch: input.bbch,
    kcCurrent,
    periodDays,
    totalRainMm: totalRain,
    totalEtcMm: totalEtc,
    netBalanceMm: netBalance,
    daily,
    status,
    irrigationSuggestionMm: irrigationSuggestion,
    irrigationTotalM3: irrigationTotalM3,
    recommendation,
  };
}
