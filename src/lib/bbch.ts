// BBCH stage tracker — automatyczne wyznaczanie fazy rozwoju rośliny.
// Używamy Growing Degree Days (GDD) — suma temperatur powyżej progu bazowego.
//
// GDD[dzień] = max(0, (T_max + T_min) / 2 - T_base)
// Różne uprawy mają różne T_base (pszenica 0°C, kukurydza 8°C, rzepak 5°C).
//
// BBCH phases source: BBCH Monografia (Hack et al., 1992), IUNG-PIB
// https://www.politicaagricola.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/2850

export type Crop = 'wheat' | 'barley' | 'rye' | 'oats' | 'corn' | 'rapeseed' | 'potato' | 'sugarbeet' | 'other';

interface BbchMilestone {
  bbch: number;
  gddFromSowing: number;
  label: string;
  description: string;
  alerts?: string[];
}

// GDD skale i milestony dla głównych upraw w Polsce.
// Wartości GDD skalibrowane dla T_base = 0°C (zboża) lub 5°C (rzepak) lub 8°C (kukurydza).
// Źródło: IUNG-PIB + COBORU 2023-2025 opracowania.
const BBCH_TABLES: Record<Crop, { tBase: number; milestones: BbchMilestone[] }> = {
  wheat: {
    tBase: 0,
    milestones: [
      { bbch: 0, gddFromSowing: 0, label: 'Siew', description: 'Ziarno w glebie' },
      { bbch: 9, gddFromSowing: 120, label: 'Wschody', description: 'Koleoptyl przebija glebę' },
      { bbch: 13, gddFromSowing: 250, label: '3. liść', description: 'Trzeci liść rozwinięty' },
      { bbch: 21, gddFromSowing: 400, label: 'Krzewienie', description: 'Pierwsze pędy boczne', alerts: ['Moment herbicydu jesiennego (jeśli ozima)'] },
      { bbch: 29, gddFromSowing: 900, label: 'Koniec krzewienia', description: 'Maksymalna liczba pędów' },
      { bbch: 30, gddFromSowing: 1000, label: 'Strzelanie w źdźbło', description: 'Pierwszy widoczny międzywęzłowy', alerts: ['MOMENT azot startowy 30-40 kg N/ha', 'Rozważ fungicyd T1'] },
      { bbch: 37, gddFromSowing: 1350, label: 'Liść flagowy', description: 'Ostatni liść widoczny', alerts: ['Fungicyd T2 (strobiluryna+triazol)', 'Azot azotowy 40-60 kg N/ha'] },
      { bbch: 49, gddFromSowing: 1600, label: 'Koniec kłoszenia', description: 'Kłos wychodzi z pochwy liściowej' },
      { bbch: 55, gddFromSowing: 1750, label: 'Początek kwitnienia', description: 'Pierwsze pylniki widoczne', alerts: ['Krytyczne okno fuzariozy (Fusarium) — monitoruj'] },
      { bbch: 65, gddFromSowing: 1850, label: 'Pełnia kwitnienia', description: '50% pylników', alerts: ['FAZA T3 — fungicyd przeciwko Fusarium jeśli deszcz + 20-30°C'] },
      { bbch: 71, gddFromSowing: 2000, label: 'Formowanie ziarna', description: 'Ziarno wodne' },
      { bbch: 75, gddFromSowing: 2200, label: 'Dojrzałość mleczna', description: 'Ziarno zielonkawe' },
      { bbch: 85, gddFromSowing: 2500, label: 'Dojrzałość woskowa', description: 'Ziarno żółte, paznokieć wbija się' },
      { bbch: 89, gddFromSowing: 2700, label: 'Dojrzałość pełna', description: 'Ziarno twarde', alerts: ['Moment zbioru (wilgotność ziarna 14-16%)'] },
    ],
  },
  barley: {
    tBase: 0,
    milestones: [
      { bbch: 0, gddFromSowing: 0, label: 'Siew', description: '' },
      { bbch: 9, gddFromSowing: 110, label: 'Wschody', description: '' },
      { bbch: 21, gddFromSowing: 380, label: 'Krzewienie', description: '' },
      { bbch: 30, gddFromSowing: 900, label: 'Strzelanie', description: '', alerts: ['Azot azotowy + regulator wzrostu (CCC)'] },
      { bbch: 37, gddFromSowing: 1200, label: 'Liść flagowy', description: '', alerts: ['Fungicyd (siatkowa plamistość)'] },
      { bbch: 55, gddFromSowing: 1600, label: 'Kłoszenie', description: '' },
      { bbch: 85, gddFromSowing: 2300, label: 'Dojrzałość woskowa', description: '' },
      { bbch: 89, gddFromSowing: 2500, label: 'Dojrzałość pełna', description: '', alerts: ['Zbiór'] },
    ],
  },
  rye: {
    tBase: 0,
    milestones: [
      { bbch: 9, gddFromSowing: 100, label: 'Wschody', description: '' },
      { bbch: 21, gddFromSowing: 350, label: 'Krzewienie', description: '' },
      { bbch: 30, gddFromSowing: 850, label: 'Strzelanie', description: '' },
      { bbch: 55, gddFromSowing: 1500, label: 'Kłoszenie', description: '' },
      { bbch: 89, gddFromSowing: 2400, label: 'Dojrzałość pełna', description: '', alerts: ['Zbiór'] },
    ],
  },
  oats: {
    tBase: 0,
    milestones: [
      { bbch: 9, gddFromSowing: 120, label: 'Wschody', description: '' },
      { bbch: 21, gddFromSowing: 400, label: 'Krzewienie', description: '' },
      { bbch: 30, gddFromSowing: 950, label: 'Strzelanie', description: '' },
      { bbch: 55, gddFromSowing: 1650, label: 'Wiechowanie', description: '' },
      { bbch: 89, gddFromSowing: 2400, label: 'Dojrzałość pełna', description: '', alerts: ['Zbiór'] },
    ],
  },
  corn: {
    tBase: 8,
    milestones: [
      { bbch: 0, gddFromSowing: 0, label: 'Siew', description: 'Kukurydza jara, sianie od 20 IV' },
      { bbch: 9, gddFromSowing: 100, label: 'Wschody', description: '' },
      { bbch: 13, gddFromSowing: 200, label: '3. liść', description: '', alerts: ['Okno herbicydu przedwschodowego/wczesnoposchodowego'] },
      { bbch: 16, gddFromSowing: 350, label: '6. liść', description: '', alerts: ['Ostatnie okno mechaniczne odchwaszczanie'] },
      { bbch: 19, gddFromSowing: 500, label: '9. liść', description: '' },
      { bbch: 51, gddFromSowing: 800, label: 'Wiecha widoczna', description: '' },
      { bbch: 63, gddFromSowing: 950, label: 'Pylenie', description: 'KRYTYCZNE okno wodne', alerts: ['Susza TERAZ = duża strata plonu (-30% przy 5 dniach stresu)'] },
      { bbch: 65, gddFromSowing: 1000, label: 'Pełnia pylenia', description: '' },
      { bbch: 75, gddFromSowing: 1300, label: 'Ziarno mleczne', description: '' },
      { bbch: 83, gddFromSowing: 1600, label: 'Ziarno woskowe', description: '' },
      { bbch: 87, gddFromSowing: 1800, label: 'Dojrzałość fizjologiczna', description: '' },
      { bbch: 89, gddFromSowing: 2000, label: 'Dojrzałość pełna', description: '', alerts: ['Zbiór (wilgotność 26-30%)'] },
    ],
  },
  rapeseed: {
    tBase: 5,
    milestones: [
      { bbch: 9, gddFromSowing: 80, label: 'Wschody', description: 'Ozimy — sianie koniec VIII' },
      { bbch: 14, gddFromSowing: 200, label: '4. liść', description: '' },
      { bbch: 19, gddFromSowing: 350, label: '9 liści', description: '', alerts: ['Jesienny fungicyd (Phoma) + regulator'] },
      { bbch: 29, gddFromSowing: 500, label: 'Koniec rozety jesiennej', description: '' },
      // Zima — wernalizacja
      { bbch: 30, gddFromSowing: 550, label: 'Start wegetacji wiosennej', description: 'Po wernalizacji' },
      { bbch: 50, gddFromSowing: 700, label: 'Strzelanie', description: '', alerts: ['Azot wiosenny 120 kg N/ha + regulator'] },
      { bbch: 55, gddFromSowing: 900, label: 'Pąki widoczne', description: '' },
      { bbch: 60, gddFromSowing: 1000, label: 'Początek kwitnienia', description: 'Żółte kwiaty', alerts: ['Fungicyd + insektycyd (słodyszek rzepakowiec)'] },
      { bbch: 65, gddFromSowing: 1100, label: 'Pełnia kwitnienia', description: '' },
      { bbch: 75, gddFromSowing: 1300, label: 'Łuszczyny wypełniają się', description: '' },
      { bbch: 85, gddFromSowing: 1500, label: 'Brązowienie nasion', description: '' },
      { bbch: 89, gddFromSowing: 1700, label: 'Dojrzałość pełna', description: '', alerts: ['Desykacja + zbiór'] },
    ],
  },
  potato: {
    tBase: 7,
    milestones: [
      { bbch: 0, gddFromSowing: 0, label: 'Sadzenie', description: '' },
      { bbch: 9, gddFromSowing: 150, label: 'Wschody', description: '' },
      { bbch: 19, gddFromSowing: 350, label: 'Zwarcie łanu', description: '' },
      { bbch: 39, gddFromSowing: 550, label: 'Koniec krzewienia wierzchołkowego', description: '' },
      { bbch: 51, gddFromSowing: 650, label: 'Pąki kwiatowe', description: '', alerts: ['Phytophthora — profilaktyka (Revus, Infinito)'] },
      { bbch: 65, gddFromSowing: 900, label: 'Kwitnienie', description: 'Bulwy ~40 g' },
      { bbch: 85, gddFromSowing: 1600, label: 'Dojrzewanie bulw', description: '' },
      { bbch: 97, gddFromSowing: 1900, label: 'Naci obumierają', description: '', alerts: ['Desykacja 14 dni przed zbiorem'] },
    ],
  },
  sugarbeet: {
    tBase: 3,
    milestones: [
      { bbch: 9, gddFromSowing: 150, label: 'Wschody', description: '' },
      { bbch: 15, gddFromSowing: 300, label: '5 liści', description: '', alerts: ['Herbicyd dawkowany (do zwarcia rzędów)'] },
      { bbch: 39, gddFromSowing: 800, label: 'Zwarcie rzędów', description: '' },
      { bbch: 49, gddFromSowing: 1200, label: 'Koniec wegetacji liści', description: '' },
      { bbch: 99, gddFromSowing: 2200, label: 'Zbiór', description: '', alerts: ['Plan zbioru (IX-XI)'] },
    ],
  },
  other: {
    tBase: 0,
    milestones: [],
  },
};

/**
 * Oblicza sumę GDD od daty siewu do teraz na podstawie dziennych temperatur.
 * @param dailyTemps Array { date, tMax, tMin } — zwykle 90-365 dni
 * @param tBase Temperatura progowa (0°C dla zbóż, 5 dla rzepaku, 8 dla kukurydzy)
 * @param sowingDate Data siewu
 */
export function calculateGdd(
  dailyTemps: Array<{ date: string; tMax: number; tMin: number }>,
  tBase: number,
  sowingDate: Date,
): number {
  let gdd = 0;
  const sowingMs = sowingDate.getTime();
  for (const day of dailyTemps) {
    const dayMs = new Date(day.date).getTime();
    if (dayMs < sowingMs) continue;
    const avg = (day.tMax + day.tMin) / 2;
    gdd += Math.max(0, avg - tBase);
  }
  return gdd;
}

export interface BbchStatus {
  crop: Crop;
  currentBbch: number;
  currentLabel: string;
  currentDescription: string;
  nextMilestone: BbchMilestone | null;
  gddToNext: number;
  daysToNext: number | null; // oszacowane na podstawie średniego GDD/dzień w tym roku
  progress: number; // 0-100 procent sezonu
  alerts: string[];
  accumulated: number;
  tBase: number;
}

/**
 * Wyznacza aktualny BBCH na podstawie GDD i uprawy.
 * Interpoluje między milestonami.
 */
export function deriveBbchStatus(input: {
  crop: Crop;
  sowingDate: Date;
  dailyTemps: Array<{ date: string; tMax: number; tMin: number }>;
}): BbchStatus | null {
  const table = BBCH_TABLES[input.crop];
  if (!table || table.milestones.length === 0) return null;

  const gdd = calculateGdd(input.dailyTemps, table.tBase, input.sowingDate);

  // Znajdź aktualny i następny milestone
  let current = table.milestones[0];
  let next: BbchMilestone | null = null;

  for (let i = 0; i < table.milestones.length; i++) {
    if (gdd >= table.milestones[i].gddFromSowing) {
      current = table.milestones[i];
      next = table.milestones[i + 1] ?? null;
    } else {
      if (!next) next = table.milestones[i];
      break;
    }
  }

  // Oszacuj dni do następnego milestona na podstawie średniej GDD/dzień
  const daysSinceSowing = Math.max(
    1,
    Math.round((Date.now() - input.sowingDate.getTime()) / 86_400_000),
  );
  const avgGddPerDay = gdd / daysSinceSowing;
  const daysToNext = next && avgGddPerDay > 0.5
    ? Math.round((next.gddFromSowing - gdd) / avgGddPerDay)
    : null;

  const totalSeason = table.milestones[table.milestones.length - 1].gddFromSowing;
  const progress = Math.min(100, Math.round((gdd / totalSeason) * 100));

  // Alerts: z aktualnego milestona + jeśli blisko następnego (<3 dni)
  const alerts: string[] = [...(current.alerts ?? [])];
  if (next?.alerts && daysToNext !== null && daysToNext <= 5) {
    for (const a of next.alerts) alerts.push(`Za ${daysToNext} dni: ${a}`);
  }

  return {
    crop: input.crop,
    currentBbch: current.bbch,
    currentLabel: current.label,
    currentDescription: current.description,
    nextMilestone: next,
    gddToNext: next ? next.gddFromSowing - gdd : 0,
    daysToNext,
    progress,
    alerts,
    accumulated: Math.round(gdd),
    tBase: table.tBase,
  };
}

/**
 * Domyślna data siewu per uprawa (jeśli user nie podał):
 * - Zboża ozime: 15 IX poprzedniego roku
 * - Zboża jare: 25 III
 * - Kukurydza: 25 IV
 * - Rzepak: 25 VIII
 * - Ziemniak: 25 IV
 * - Burak cukrowy: 5 IV
 */
export function defaultSowingDate(crop: Crop, currentYear: number): Date {
  const spring = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month - 1, day));
  switch (crop) {
    case 'wheat':
    case 'rye':
      return spring(currentYear - 1, 9, 15); // ozime
    case 'barley':
    case 'oats':
      return spring(currentYear, 3, 25); // jare
    case 'corn':
      return spring(currentYear, 4, 25);
    case 'rapeseed':
      return spring(currentYear - 1, 8, 25);
    case 'potato':
      return spring(currentYear, 4, 25);
    case 'sugarbeet':
      return spring(currentYear, 4, 5);
    default:
      return spring(currentYear, 4, 1);
  }
}
