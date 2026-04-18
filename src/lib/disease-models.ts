// Modele prognozujące ryzyko chorób grzybowych upraw.
// Progi zgodne z literaturą agronomiczną (IUNG-PIB, COBORU, FAO).
//
// Używamy hourly weather z Open-Meteo żeby policzyć:
// - Smith period (Phytophthora)
// - LTA (Leaf Time Area) dla rdzy
// - Godziny ryzyka Septoria

import type { WeatherDaily, HourlyPoint } from './satellite/weather';

export interface DiseaseRisk {
  disease: string;
  risk: 'low' | 'medium' | 'high';
  score: number; // 0-100
  reason: string;
  action: string;
  crops: string[]; // których upraw dotyczy
}

export interface DiseaseAssessmentInput {
  crop: string;
  hourly: HourlyPoint[]; // ~72h
  daily: WeatherDaily | null;
  ndviMean: number;
  ndviPrevious?: number;
  bbchStage?: number; // opcjonalnie faza rozwoju
}

const CEREAL = ['wheat', 'barley', 'rye', 'oats'];
const POTATO = ['potato'];
const RAPESEED = ['rapeseed'];

export function assessDiseaseRisks(input: DiseaseAssessmentInput): DiseaseRisk[] {
  const risks: DiseaseRisk[] = [];
  const { crop, hourly, daily } = input;

  // ── 1. Septoria tritici (pszenica) ──
  // Warunki: RH > 85% przez 4+ godzin + temp 15-25°C + BBCH 30+
  if (CEREAL.includes(crop)) {
    const septoriaHours = hourly.filter(
      (h) => h.humidity > 85 && h.temp >= 15 && h.temp <= 25 && h.precip < 2,
    ).length;
    if (septoriaHours >= 6) {
      risks.push({
        disease: 'Septoria tritici',
        risk: septoriaHours >= 12 ? 'high' : 'medium',
        score: Math.min(100, septoriaHours * 6),
        reason: `${septoriaHours}h wilgotności >85% i temp 15-25°C w ciągu 72h — warunki sprzyjające septoriozie liści.`,
        action:
          'Fungicyd triazolowy w fazie kłoszenia (BBCH 47+): protiokonazol 250g/l 0.5 l/ha (Input, Proline) albo tebukonazol 250g/l 1 l/ha (Mystic, Falcon).',
        crops: CEREAL,
      });
    }
  }

  // ── 2. Fusarium head blight (zboża w fazie kwitnienia, BBCH 61-69) ──
  // Warunki: opad + temp 20-30°C podczas kwitnienia (2-3 dni pod rząd)
  if (CEREAL.includes(crop) && daily) {
    const rainyWarmDays = daily.dates.slice(0, 3).filter((_, i) => {
      return (
        daily.precipitation[i] > 2 &&
        daily.tempMax[i] >= 20 &&
        daily.tempMax[i] <= 30
      );
    }).length;
    if (rainyWarmDays >= 2 && (input.bbchStage === undefined || (input.bbchStage >= 61 && input.bbchStage <= 69))) {
      risks.push({
        disease: 'Fuzarioza kłosów (Fusarium)',
        risk: 'high',
        score: 85,
        reason: `Opady + temperatura 20-30°C podczas fazy kwitnienia — wysokie ryzyko fuzariozy, porażenie obniża plon i zwiększa mykotoksyny DON.`,
        action:
          'PILNE: fungicyd z metkonazolem / protiokonazolem / tebukonazolem w BBCH 65 (pełnia kwitnienia). Prosaro 250 EC 1 l/ha lub Osiris Star 1.5 l/ha. Efekt max gdy zastosujesz w ciągu 2-3 dni od zapylenia.',
        crops: CEREAL,
      });
    }
  }

  // ── 3. Rdza brunatna / żółta (pszenica) ──
  // Warunki: rosy nocne + 15-22°C + wysoka RH przez wiele godzin
  if (crop === 'wheat') {
    const rustHours = hourly.filter((h, i) => {
      const hour = new Date(h.time).getHours();
      return (
        (hour < 8 || hour > 20) && // noc / rano
        h.humidity > 90 &&
        h.temp >= 10 &&
        h.temp <= 22
      );
    }).length;
    if (rustHours >= 8) {
      risks.push({
        disease: 'Rdza brunatna / żółta',
        risk: rustHours >= 15 ? 'high' : 'medium',
        score: Math.min(100, rustHours * 5),
        reason: `${rustHours}h nocnych rosy (RH>90%, 10-22°C) — warunki sprzyjające zarodnikowaniu rdzy.`,
        action:
          'Fungicyd strobilurynowy + triazol w BBCH 37-59: Amistar 250 SC 1 l/ha + Mystic 1 l/ha, albo gotowy mix Priori Xtra 1 l/ha.',
        crops: ['wheat'],
      });
    }
  }

  // ── 4. Mączniak prawdziwy (zboża, rzepak) ──
  // Warunki: suche + umiarkowane (brak deszczu 3+ dni + temp 15-25°C + RH 50-70%)
  if (CEREAL.includes(crop) || crop === 'rapeseed') {
    const dryHours = hourly.filter(
      (h) => h.precip < 0.1 && h.temp >= 15 && h.temp <= 25 && h.humidity >= 50 && h.humidity <= 70,
    ).length;
    if (dryHours >= 20 && input.ndviMean > 0.5) {
      risks.push({
        disease: 'Mączniak prawdziwy',
        risk: 'medium',
        score: 55,
        reason: `Długi okres suchej, umiarkowanej pogody na gęstym łanie — klasyczne warunki dla mączniaka.`,
        action:
          'Siarka elementarna 5 kg/ha profilaktycznie (tani i skuteczny) albo triazol (Input 1.25 l/ha) na pierwsze objawy.',
        crops: [...CEREAL, 'rapeseed'],
      });
    }
  }

  // ── 5. Smith period (Phytophthora infestans w ziemniakach) ──
  // Smith period = 2 kolejne dni po min 11h RH>=90% przy temp min 10°C
  if (POTATO.includes(crop) && hourly.length >= 48) {
    const day1 = hourly.slice(0, 24);
    const day2 = hourly.slice(24, 48);
    const d1Hours = day1.filter((h) => h.humidity >= 90 && h.temp >= 10).length;
    const d2Hours = day2.filter((h) => h.humidity >= 90 && h.temp >= 10).length;
    if (d1Hours >= 11 && d2Hours >= 11) {
      risks.push({
        disease: 'Zaraza ziemniaka (Phytophthora infestans)',
        risk: 'high',
        score: 90,
        reason: `Smith period: 2 dni pod rząd z ${d1Hours}h i ${d2Hours}h RH>=90% i temp >=10°C — krytyczne warunki dla zarazy.`,
        action:
          'PILNE: fungicyd systemiczny w ciągu 48h. Infinito 1.2 l/ha (fluopikolid + propamokarb) albo Revus 0.6 l/ha (mandipropamid). Powtórz za 7-10 dni.',
        crops: POTATO,
      });
    }
  }

  // ── 6. Alternaria (ziemniak, rzepak) ──
  if ((POTATO.includes(crop) || crop === 'rapeseed') && daily) {
    const warmHumid = daily.dates.slice(0, 7).filter((_, i) => {
      return (
        daily.tempMax[i] >= 20 &&
        daily.tempMax[i] <= 28 &&
        (daily.precipitation[i] > 1 || (daily.soilMoistureShallow[i] ?? 0) > 0.3)
      );
    }).length;
    if (warmHumid >= 4) {
      risks.push({
        disease: 'Alternaria',
        risk: 'medium',
        score: 60,
        reason: `Ciepłe i wilgotne warunki w ciągu 7 dni — sprzyjają alternariozie liści.`,
        action: 'Fungicyd z azoksystrobina + chlorotalonil albo dlfenokonazol. Revus Top 0.6 l/ha.',
        crops: [...POTATO, 'rapeseed'],
      });
    }
  }

  // ── 7. Sucha zgnilizna kapustnych (Phoma lingam, rzepak) ──
  if (RAPESEED.includes(crop) && daily) {
    const phomaDays = daily.dates.slice(0, 7).filter((_, i) => {
      return daily.tempMax[i] >= 15 && daily.precipitation[i] > 3;
    }).length;
    if (phomaDays >= 3 && input.bbchStage !== undefined && input.bbchStage >= 20 && input.bbchStage <= 30) {
      risks.push({
        disease: 'Sucha zgnilizna kapustnych (Phoma)',
        risk: 'medium',
        score: 65,
        reason: 'Ciepły mokry okres w fazie formowania rozety — ryzyko suchej zgnilizny.',
        action: 'Fungicyd jesienny z tebukonazolem + metkonazolem: Caryx 1 l/ha albo Topsin M 1 kg/ha.',
        crops: RAPESEED,
      });
    }
  }

  // Sortuj po ryzyku
  risks.sort((a, b) => b.score - a.score);
  return risks;
}
