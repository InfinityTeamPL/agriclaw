// Heat stress — ocena ryzyka przegrzania upraw na podstawie prognozy max temp.
// Progi skalibrowane dla polskich warunków + BBCH (okno wrażliwości).
//
// Klucz: każda uprawa ma wąskie okno krytycznej wrażliwości na ciepło:
// - Pszenica grain filling (BBCH 70-89): >32°C zatrzymuje napełnianie ziarna (kernel abortion)
// - Rzepak kwitnienie (BBCH 60-69): >28°C przez 3+ dni aborcja kwiatów, puste łuszczyny
// - Kukurydza pylenie (BBCH 60-69): >35°C zabija ziarna pyłku, efekt "łysek" w kolbie
// - Ziemniak tuberyzacja (BBCH 40-85): >25°C hamuje przyrost bulw (heat shock enzymów)

import type { Crop } from './bbch';

export type HeatLevel = 'safe' | 'watch' | 'warning' | 'critical';

export interface HeatThresholds {
  /** Powyżej tej temperatury (°C) zaczyna się stres. */
  stressThreshold: number;
  /** Powyżej tej temperatury (°C) występują nieodwracalne straty plonu. */
  criticalThreshold: number;
  sensitivityPhase: string;
}

function thresholdsFor(crop: Crop, bbch: number): HeatThresholds {
  switch (crop) {
    case 'wheat':
    case 'rye':
    case 'oats':
    case 'barley':
      if (bbch < 60)
        return { stressThreshold: 32, criticalThreshold: 36, sensitivityPhase: 'wegetacja wczesna — mało wrażliwa' };
      if (bbch < 70)
        return { stressThreshold: 28, criticalThreshold: 32, sensitivityPhase: 'kwitnienie/pylenie (WRAŻLIWE)' };
      if (bbch < 89)
        return { stressThreshold: 30, criticalThreshold: 34, sensitivityPhase: 'napełnianie ziarna (KRYTYCZNE)' };
      return { stressThreshold: 35, criticalThreshold: 40, sensitivityPhase: 'dojrzewanie' };

    case 'rapeseed':
      if (bbch < 59)
        return { stressThreshold: 30, criticalThreshold: 34, sensitivityPhase: 'strzelanie' };
      if (bbch < 70)
        return { stressThreshold: 27, criticalThreshold: 30, sensitivityPhase: 'kwitnienie (KRYTYCZNE — aborcja kwiatów)' };
      if (bbch < 85)
        return { stressThreshold: 29, criticalThreshold: 33, sensitivityPhase: 'wypełnianie łuszczyn' };
      return { stressThreshold: 35, criticalThreshold: 40, sensitivityPhase: 'dojrzewanie' };

    case 'corn':
      if (bbch < 55)
        return { stressThreshold: 35, criticalThreshold: 38, sensitivityPhase: 'rozwój liści' };
      if (bbch < 70)
        return { stressThreshold: 32, criticalThreshold: 35, sensitivityPhase: 'pylenie (KRYTYCZNE — pyłek ginie)' };
      if (bbch < 85)
        return { stressThreshold: 33, criticalThreshold: 36, sensitivityPhase: 'napełnianie ziarna' };
      return { stressThreshold: 36, criticalThreshold: 40, sensitivityPhase: 'dojrzewanie' };

    case 'potato':
      if (bbch < 40)
        return { stressThreshold: 28, criticalThreshold: 32, sensitivityPhase: 'rozwój naci' };
      if (bbch < 85)
        return { stressThreshold: 25, criticalThreshold: 30, sensitivityPhase: 'tuberyzacja (KRYTYCZNE — hamowanie przyrostu bulw)' };
      return { stressThreshold: 30, criticalThreshold: 34, sensitivityPhase: 'dojrzewanie' };

    case 'sugarbeet':
      if (bbch < 40)
        return { stressThreshold: 30, criticalThreshold: 35, sensitivityPhase: 'wschody/rozwój' };
      return { stressThreshold: 32, criticalThreshold: 36, sensitivityPhase: 'gromadzenie cukru' };

    case 'other':
    default:
      return { stressThreshold: 32, criticalThreshold: 36, sensitivityPhase: 'nieznana faza' };
  }
}

export interface HeatDay {
  date: string;
  tMax: number;
  level: HeatLevel;
  headline: string;
}

export interface HeatAssessment {
  crop: Crop;
  bbch: number;
  thresholds: HeatThresholds;
  days: HeatDay[];
  worstLevel: HeatLevel;
  /** Liczba kolejnych dni ze stresem (>threshold). */
  consecutiveStressDays: number;
  maxTempC: number;
  firstDangerDate: string | null;
  recommendation: string;
  shouldCreateRecommendation: boolean;
}

function classifyDay(tMax: number, th: HeatThresholds): { level: HeatLevel; headline: string } {
  if (tMax >= th.criticalThreshold) {
    return {
      level: 'critical',
      headline: `${tMax.toFixed(0)}°C — silny stres cieplny, realne straty plonu`,
    };
  }
  if (tMax >= th.stressThreshold) {
    return {
      level: 'warning',
      headline: `${tMax.toFixed(0)}°C — stres cieplny, roślina ogranicza fotosyntezę`,
    };
  }
  if (tMax >= th.stressThreshold - 3) {
    return {
      level: 'watch',
      headline: `${tMax.toFixed(0)}°C — wysokie ale jeszcze bezpieczne`,
    };
  }
  return {
    level: 'safe',
    headline: `${tMax.toFixed(0)}°C — komfortowo`,
  };
}

function severityOrder(l: HeatLevel): number {
  return { safe: 0, watch: 1, warning: 2, critical: 3 }[l];
}

function buildRecommendation(a: {
  crop: Crop;
  bbch: number;
  worst: HeatLevel;
  days: HeatDay[];
  consecutive: number;
  thresholds: HeatThresholds;
}): string {
  if (a.worst === 'safe') {
    return 'Prognoza bezpieczna — max dzienne < progu stresu.';
  }
  if (a.worst === 'watch') {
    return 'Prognoza pokazuje wysokie temperatury, ale poniżej progu stresu. Obserwuj rośliny w najcieplejszej porze dnia (13-16).';
  }

  if (a.crop === 'corn' && a.bbch >= 60 && a.bbch < 70) {
    return `Kukurydza w pyleniu — temperatura >${a.thresholds.stressThreshold}°C zabija pyłek. ${a.consecutive >= 3 ? 'UWAGA: ' + a.consecutive + ' dni pod rząd — ryzyko częściowych "łysek" w kolbie (barrenness). ' : ''}Nawadnianie poranne (4-7) jest KRYTYCZNE — utrzymuje liście uwodnione i obniża temp mikroklimatu łanu o 3-5°C. Jeśli masz wentylatory przeciwprzymrozkowe — też działają latem (mieszanie powietrza). NIE pryskaj herbicydów / regulatorów — dodatkowy stres.`;
  }
  if (a.crop === 'rapeseed' && a.bbch >= 60 && a.bbch < 70) {
    return `Rzepak w kwitnieniu — >${a.thresholds.stressThreshold}°C przyspiesza aborcję kwiatów. Nawadnianie jeśli masz dostęp. Po fali upałów oceń % zawiązanych łuszczyn — jeśli <60%, rzepak odbuduje z pędów bocznych ale plon spadnie o 15-30%. NIE aplikuj herbicydów ani regulatorów w tym oknie.`;
  }
  if ((a.crop === 'wheat' || a.crop === 'barley') && a.bbch >= 70 && a.bbch < 89) {
    return `Zboże w napełnianiu ziarna — >${a.thresholds.stressThreshold}°C skraca okres nalewania, ziarno będzie drobne (szczuplejsze, niższa MTZ). ${a.consecutive >= 3 ? a.consecutive + ' dni pod rząd: plan zbioru może przesunąć się o 5-7 dni wcześniej. ' : ''}Nawadnianie wydłuży okres dojrzewania. Rozważ wcześniejszy zbiór (nawet przy wilgotności 18% — dosuszenie taniej niż strata MTZ).`;
  }
  if (a.crop === 'potato' && a.bbch >= 40 && a.bbch < 85) {
    return `Ziemniak w tuberyzacji — >${a.thresholds.stressThreshold}°C zatrzymuje przyrost bulw (heat shock enzymów). ${a.consecutive >= 3 ? a.consecutive + ' dni pod rząd = poważna strata plonu. ' : ''}Nawadnianie deszczownią z rana (niech woda wyparuje w ciągu dnia, schładzając). Obserwuj spękanie i zazielenienie bulw.`;
  }

  return `Temperatura powyżej ${a.thresholds.stressThreshold}°C w fazie "${a.thresholds.sensitivityPhase}". ${a.consecutive >= 3 ? a.consecutive + ' dni stresu pod rząd — realne straty plonu. ' : ''}Nawadnianie rano, unikaj wszelkich oprysków w tym oknie (stres kumuluje się).`;
}

export interface HeatInput {
  crop: Crop;
  bbch: number;
  forecast: Array<{ date: string; tMax: number }>;
}

export function assessHeatStress(input: HeatInput): HeatAssessment {
  const thresholds = thresholdsFor(input.crop, input.bbch);
  const days: HeatDay[] = input.forecast.map((day) => {
    const { level, headline } = classifyDay(day.tMax, thresholds);
    return { date: day.date, tMax: day.tMax, level, headline };
  });
  const worstLevel = days.reduce<HeatLevel>(
    (worst, d) => (severityOrder(d.level) > severityOrder(worst) ? d.level : worst),
    'safe',
  );

  // Liczba kolejnych dni stressujących (>=warning) — liczy najdłuższą serię
  let consecutive = 0;
  let maxConsecutive = 0;
  for (const d of days) {
    if (d.level === 'warning' || d.level === 'critical') {
      consecutive++;
      if (consecutive > maxConsecutive) maxConsecutive = consecutive;
    } else {
      consecutive = 0;
    }
  }

  const maxTempC = days.length > 0 ? Math.max(...days.map((d) => d.tMax)) : 0;
  const firstDangerDate =
    days.find((d) => d.level === 'warning' || d.level === 'critical')?.date ?? null;

  const recommendation = buildRecommendation({
    crop: input.crop,
    bbch: input.bbch,
    worst: worstLevel,
    days,
    consecutive: maxConsecutive,
    thresholds,
  });

  const shouldCreateRecommendation =
    worstLevel === 'critical' || (worstLevel === 'warning' && maxConsecutive >= 3);

  return {
    crop: input.crop,
    bbch: input.bbch,
    thresholds,
    days,
    worstLevel,
    consecutiveStressDays: maxConsecutive,
    maxTempC,
    firstDangerDate,
    recommendation,
    shouldCreateRecommendation,
  };
}
