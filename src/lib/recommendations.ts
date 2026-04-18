// Silnik rekomendacji rule-based dla MVP
// W Fazie 4 zastąpiony przez agenta OpenClaw z kontekstem historii pola

export type Severity = 'none' | 'low' | 'medium' | 'high';

export interface RecommendationInput {
  crop: string;
  ndviMean: number;
  ndviPrevious?: number;
  daysWithoutRain: number;
  avgEt0Next7: number;
  soilMoisturePct?: number; // 0-100
  monthOfYear?: number; // 1-12
}

export interface RecommendationOutput {
  severity: Severity;
  title: string;
  message: string;
  action: string;
}

const CROP_LABELS: Record<string, string> = {
  wheat: 'pszenicy',
  corn: 'kukurydzy',
  rapeseed: 'rzepaku',
  barley: 'jęczmienia',
  potato: 'ziemniaków',
  other: 'uprawy',
};

export function generateRecommendation(
  input: RecommendationInput,
): RecommendationOutput {
  const {
    crop,
    ndviMean,
    ndviPrevious,
    daysWithoutRain,
    avgEt0Next7,
    soilMoisturePct,
  } = input;
  const cropLabel = CROP_LABELS[crop] ?? 'uprawy';
  const ndviDrop = ndviPrevious !== undefined ? ndviPrevious - ndviMean : 0;

  // HIGH: silny stres suszowy + zła prognoza
  if (
    ndviMean < 0.35 &&
    daysWithoutRain >= 5 &&
    avgEt0Next7 > 3 &&
    (soilMoisturePct === undefined || soilMoisturePct < 25)
  ) {
    return {
      severity: 'high',
      title: 'Pilny stres suszowy',
      message: `Stan ${cropLabel} pogarsza się. NDVI ${ndviMean.toFixed(2)}, ${daysWithoutRain} dni bez deszczu, parowanie ${avgEt0Next7.toFixed(1)} mm/dzień.`,
      action:
        'Jeśli masz nawadnianie — dziś 18:00-22:00 albo jutro 5:30-9:00. Bez nawadniania: oprysk spowalniający parowanie (antytranspirant).',
    };
  }

  // MEDIUM: spadek NDVI bez suszy → podejrzenie choroby
  if (ndviDrop > 0.12 && daysWithoutRain < 4) {
    return {
      severity: 'medium',
      title: 'Możliwa choroba grzybowa',
      message: `NDVI spadł o ${ndviDrop.toFixed(2)} w ostatnim okresie przy normalnej wilgotności. Typowy objaw infekcji ${cropLabel === 'pszenicy' ? '(rdza, mączniak)' : '(plamistość liści, fuzarioza)'}.`,
      action:
        'Sprawdź pole wizualnie w 2-3 miejscach. Rozważ fungicyd triazolowy profilaktycznie w ciągu 3 dni. Unikaj oprysku przy wietrze >15 km/h.',
    };
  }

  // MEDIUM: umiarkowany stres suszowy
  if (daysWithoutRain >= 3 && ndviMean < 0.5) {
    return {
      severity: 'medium',
      title: 'Umiarkowany stres wodny',
      message: `${daysWithoutRain} dni bez deszczu, NDVI ${ndviMean.toFixed(2)}. Stan jeszcze nie krytyczny, ale warto działać wyprzedzająco.`,
      action:
        'Sprawdź wilgotność gleby łopatą (30 cm głębokości). Jeśli sucha: planuj nawadnianie w ciągu 48h lub oprysk antytranspirantem.',
    };
  }

  // LOW: przeciętna kondycja
  if (ndviMean < 0.55) {
    return {
      severity: 'low',
      title: 'Średnia kondycja pola',
      message: `NDVI ${ndviMean.toFixed(2)}. ${cropLabel.charAt(0).toUpperCase() + cropLabel.slice(1)} w przeciętnej formie.`,
      action:
        'Monitoruj przez 3-5 dni. Rozważ dokarmianie dolistne azotem (mocznik 5%) jeśli faza rozwoju na to pozwala.',
    };
  }

  // NONE: wszystko OK
  return {
    severity: 'none',
    title: 'Pole w dobrej kondycji',
    message: `NDVI ${ndviMean.toFixed(2)}. ${cropLabel.charAt(0).toUpperCase() + cropLabel.slice(1)} zdrowa, brak konieczności interwencji.`,
    action: 'Kontynuuj standardowy plan. Kolejna analiza za 3-5 dni.',
  };
}
