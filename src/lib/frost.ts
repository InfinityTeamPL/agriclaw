// Frost risk engine — oblicza ryzyko przymrozków na podstawie prognozy
// minimalnej temperatury nocnej i BBCH stage + gatunku.
// Progi uszkodzeń skalibrowane wg IUNG-PIB, COBORU i DLG (Deutsche Landwirtschafts-Gesellschaft).
//
// Kluczowy fakt agronomiczny: mrozoodporność ZNIKA w kwitnieniu.
// Pszenica ozima przetrwa -15°C zimą ale ginie przy -2°C w kłoszeniu.
// Rzepak kwitnący ginie przy -4°C. Kukurydza ginie przy pierwszym 0°C.

import type { Crop } from './bbch';

export type FrostLevel = 'safe' | 'watch' | 'warning' | 'critical';

export interface FrostThresholds {
  /** Poniżej tej temperatury (°C) roślina zostaje uszkodzona. */
  damageThreshold: number;
  /** Poniżej tej temperatury (°C) uszkodzenia są nieodwracalne / roślina ginie. */
  lethalThreshold: number;
  /** Opis fazy wrażliwości dla UI. */
  sensitivityPhase: string;
}

/** Progi wg uprawy i BBCH — każda uprawa ma "okna wrażliwości". */
function thresholdsFor(crop: Crop, bbch: number): FrostThresholds {
  switch (crop) {
    case 'wheat':
    case 'rye':
    case 'oats':
    case 'barley':
      // Zboża ozime: zimno-wytrzymałe do kłoszenia, potem dramatycznie wrażliwe.
      if (bbch < 21)
        return { damageThreshold: -12, lethalThreshold: -18, sensitivityPhase: 'wschody/rozeta (mrozoodporne)' };
      if (bbch < 30)
        return { damageThreshold: -8, lethalThreshold: -12, sensitivityPhase: 'krzewienie (dobrze znosi)' };
      if (bbch < 45)
        return { damageThreshold: -4, lethalThreshold: -6, sensitivityPhase: 'strzelanie w źdźbło (wrażliwe)' };
      if (bbch < 55)
        return { damageThreshold: -3, lethalThreshold: -4, sensitivityPhase: 'liść flagowy (bardzo wrażliwe)' };
      if (bbch < 70)
        return { damageThreshold: -1, lethalThreshold: -2, sensitivityPhase: 'kłoszenie/kwitnienie (KRYTYCZNE)' };
      return { damageThreshold: 0, lethalThreshold: -2, sensitivityPhase: 'formowanie ziarna' };

    case 'rapeseed':
      // Rzepak: ozimy przetrwa zimą ale łuszczyny i pąki pękają przy mrozie.
      if (bbch < 29)
        return { damageThreshold: -10, lethalThreshold: -15, sensitivityPhase: 'rozeta jesienna (zahartowany)' };
      if (bbch < 49)
        return { damageThreshold: -4, lethalThreshold: -6, sensitivityPhase: 'ruszenie/strzelanie' };
      if (bbch < 59)
        return { damageThreshold: -3, lethalThreshold: -4, sensitivityPhase: 'pąki kwiatowe (wrażliwe)' };
      if (bbch < 70)
        return { damageThreshold: -2, lethalThreshold: -4, sensitivityPhase: 'kwitnienie (KRYTYCZNE — żółte kwiaty)' };
      if (bbch < 85)
        return { damageThreshold: -1, lethalThreshold: -3, sensitivityPhase: 'wypełnianie łuszczyn' };
      return { damageThreshold: 0, lethalThreshold: -2, sensitivityPhase: 'dojrzewanie' };

    case 'corn':
      // Kukurydza: TERMOFILNA. 0°C to już poważna sprawa.
      if (bbch < 10)
        return { damageThreshold: -1, lethalThreshold: -3, sensitivityPhase: 'wschody' };
      if (bbch < 50)
        return { damageThreshold: 0, lethalThreshold: -2, sensitivityPhase: 'rozwój liści (wrażliwe)' };
      if (bbch < 70)
        return { damageThreshold: 0, lethalThreshold: -1, sensitivityPhase: 'pylenie (KRYTYCZNE)' };
      return { damageThreshold: 0, lethalThreshold: -2, sensitivityPhase: 'dojrzewanie ziarna' };

    case 'potato':
      // Ziemniak: każdy przymrozek zabija nać.
      if (bbch < 10)
        return { damageThreshold: 0, lethalThreshold: -2, sensitivityPhase: 'przed wschodami (bulwy odporne)' };
      return { damageThreshold: 0, lethalThreshold: -1, sensitivityPhase: 'wegetacja naci (KRYTYCZNE)' };

    case 'sugarbeet':
      if (bbch < 19)
        return { damageThreshold: -3, lethalThreshold: -5, sensitivityPhase: 'wschody/5 liści' };
      return { damageThreshold: -4, lethalThreshold: -7, sensitivityPhase: 'zwarcie rzędów' };

    case 'other':
    default:
      // Konserwatywnie — 0°C jako damage.
      return { damageThreshold: 0, lethalThreshold: -3, sensitivityPhase: 'nieznana faza' };
  }
}

export interface FrostNight {
  /** ISO data (YYYY-MM-DD). */
  date: string;
  tMin: number;
  level: FrostLevel;
  /** Krótki opis czego się spodziewać (pl). */
  headline: string;
}

export interface FrostAssessment {
  crop: Crop;
  bbch: number;
  thresholds: FrostThresholds;
  nights: FrostNight[];
  /** Najgorszy poziom w całym oknie prognozy. */
  worstLevel: FrostLevel;
  /** Pierwsza noc z warning/critical (jeśli jest). */
  firstDangerDate: string | null;
  /** Najniższa prognozowana temperatura. */
  minTempC: number;
  /** Rekomendacja polsko-językowa (2-5 zdań). */
  recommendation: string;
  /** Czy dodać ten alert do Rekomendacji (severity != "none"). */
  shouldCreateRecommendation: boolean;
}

function classifyNight(tMin: number, th: FrostThresholds): { level: FrostLevel; headline: string } {
  if (tMin <= th.lethalThreshold) {
    return {
      level: 'critical',
      headline: `${tMin.toFixed(1)}°C — uszkodzenia nieodwracalne przy tej fazie`,
    };
  }
  if (tMin <= th.damageThreshold) {
    return {
      level: 'critical',
      headline: `${tMin.toFixed(1)}°C — uszkodzenia gwarantowane`,
    };
  }
  if (tMin <= th.damageThreshold + 2) {
    return {
      level: 'warning',
      headline: `${tMin.toFixed(1)}°C — granica bezpieczeństwa, ryzyko lokalnych mrozowisk`,
    };
  }
  if (tMin <= 3) {
    return {
      level: 'watch',
      headline: `${tMin.toFixed(1)}°C — chłodno, przymrozek przygruntowy możliwy`,
    };
  }
  return {
    level: 'safe',
    headline: `${tMin.toFixed(1)}°C — bezpiecznie`,
  };
}

function severityOrder(l: FrostLevel): number {
  return { safe: 0, watch: 1, warning: 2, critical: 3 }[l];
}

function buildRecommendation(a: {
  crop: Crop;
  bbch: number;
  worst: FrostLevel;
  nights: FrostNight[];
  thresholds: FrostThresholds;
}): string {
  const danger = a.nights.filter((n) => n.level === 'warning' || n.level === 'critical');
  if (a.worst === 'safe') {
    return 'Prognoza bezpieczna — minimum nocne > 3°C przez cały okres. Brak zagrożenia przymrozkami.';
  }
  if (a.worst === 'watch') {
    return 'Prognoza pokazuje zimne noce (do 3°C), ale bez ryzyka uszkodzenia. Warto obserwować — w obniżeniach terenu i dolinach temperatura może spaść o kolejne 2-3°C poniżej wartości meteo (mrozowiska). Rano sprawdź rośliny na obrzeżach pola.';
  }

  const dniList = danger
    .map((n) => new Date(n.date).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'short', day: 'numeric', month: 'short' }))
    .join(', ');

  // Rekomendacje per uprawa
  if (a.crop === 'corn') {
    return `Kukurydza w fazie "${a.thresholds.sensitivityPhase}" — każdy przymrozek uszkadza liście. Krytyczne noce: ${dniList}. Jeśli jeszcze nie posiałeś — OPÓŹNIJ SIEW o 3-5 dni. Jeśli są już wschody — w polach zagłębionych rozważ zraszanie 2-3 mm wieczorem (noc z wodą w glebie jest cieplejsza o 1-2°C, efekt masy termicznej). Po przymrozku kontynuuj wegetację tylko jeśli serce rośliny (stożek) jest żywe — wytnij liść i sprawdź.`;
  }
  if (a.crop === 'rapeseed' && a.bbch >= 55 && a.bbch < 70) {
    return `Rzepak w kwitnieniu — krytyczna faza. Prognozowane przymrozki: ${dniList}. Jeśli masz plantację w dolinie — uruchom wiatraki przeciwprzymrozkowe jeśli dostępne. Zraszanie wody wieczorem (1-2 mm) obniży ryzyko. PO przymrozku zrób lustrację — jeśli > 30% kwiatów ściemnieje, nie pryskaj zbyt szybko; rzepak potrafi odbudować kwitnienie z pędów bocznych 5-7 dni.`;
  }
  if ((a.crop === 'wheat' || a.crop === 'rye' || a.crop === 'oats' || a.crop === 'barley') && a.bbch >= 45) {
    return `Zboże w fazie "${a.thresholds.sensitivityPhase}" — krytyczne okno przymrozków: ${dniList}. Jeśli nawadniasz — uruchom zraszanie wieczorem (efekt termiczny wody). Po przymrozku NIE dokarmiaj azotem przez 7-10 dni (dodatkowy stres). Wykonaj lustrację: przetnij kilka źdźbeł — brązowy/wodnisty kłos = zniszczony, zielony z punktowymi plamami = pole się odbuduje.`;
  }
  if (a.crop === 'potato') {
    return `Ziemniak — nać niszczy każdy przymrozek. Prognozowane noce z ryzykiem: ${dniList}. Jeśli nać jest już wysoka — obsypanie, okrycie agrowłókniną lub zadymianie (słoma, suche gałęzie) rano 3-6. Po przymrozku nać odrośnie z niezmrożonych bulw (strata 7-14 dni wegetacji).`;
  }

  return `Prognozowane przymrozki: ${dniList}. Faza "${a.thresholds.sensitivityPhase}" jest wrażliwa na temperatury < ${a.thresholds.damageThreshold}°C. Monitoruj obniżenia terenu (mrozowiska) — temperatura tam może spaść o 2-4°C poniżej wartości z prognozy. Zraszanie 1-2 mm wieczorem działa dobrze na małych areałach.`;
}

export interface FrostInput {
  crop: Crop;
  bbch: number;
  /** Array { date, tMin } — prognoza minimalnej temperatury na 7-14 dni. */
  forecast: Array<{ date: string; tMin: number }>;
}

export function assessFrostRisk(input: FrostInput): FrostAssessment {
  const thresholds = thresholdsFor(input.crop, input.bbch);
  const nights: FrostNight[] = input.forecast.map((day) => {
    const { level, headline } = classifyNight(day.tMin, thresholds);
    return { date: day.date, tMin: day.tMin, level, headline };
  });
  const worstLevel = nights.reduce<FrostLevel>(
    (worst, n) => (severityOrder(n.level) > severityOrder(worst) ? n.level : worst),
    'safe',
  );
  const firstDangerDate =
    nights.find((n) => n.level === 'warning' || n.level === 'critical')?.date ?? null;
  const minTempC = nights.length > 0 ? Math.min(...nights.map((n) => n.tMin)) : 99;
  const recommendation = buildRecommendation({
    crop: input.crop,
    bbch: input.bbch,
    worst: worstLevel,
    nights,
    thresholds,
  });
  const shouldCreateRecommendation = worstLevel === 'warning' || worstLevel === 'critical';

  return {
    crop: input.crop,
    bbch: input.bbch,
    thresholds,
    nights,
    worstLevel,
    firstDangerDate,
    minTempC,
    recommendation,
    shouldCreateRecommendation,
  };
}
