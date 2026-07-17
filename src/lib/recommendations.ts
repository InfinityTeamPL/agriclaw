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

/**
 * Pojedyncza przesłanka, która zadecydowała o rekomendacji.
 *
 * PO CO: badania adopcji wskazują nieprzejrzystość AI jako barierę zaufania —
 * rolnik ma widzieć, CO i JAKI PRÓG uruchomił zalecenie, a nie dostać werdykt
 * „bo tak". To także element „wsparcia decyzji, nie polecenia": mając przesłanki,
 * rolnik może się z nimi nie zgodzić (np. wie, że wczoraj padało lokalnie).
 */
export interface Evidence {
  /** Co mierzymy, np. „NDVI" albo „Dni bez deszczu". */
  label: string;
  /** Zmierzona wartość, sformatowana po polsku. */
  value: string;
  /** Próg reguły, np. „poniżej 0,35". Null = przesłanka kontekstowa, nie progowa. */
  threshold: string | null;
  /** Skąd wartość pochodzi — rolnik ma wiedzieć, czy to satelita, czy prognoza. */
  source: string;
}

export interface RecommendationOutput {
  severity: Severity;
  title: string;
  message: string;
  action: string;
  /** Stabilny identyfikator reguły — do testów, telemetrii i sporów „czemu to wyszło". */
  ruleId: string;
  /** Przesłanki, które uruchomiły tę regułę (warstwa „dlaczego"). */
  why: Evidence[];
}

/** Liczba po polsku (przecinek dziesiętny) — spójnie z resztą UI. */
function pl(n: number, digits = 2): string {
  return n.toLocaleString('pl-PL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const SRC_S2 = 'Sentinel-2 (ostatnie 14 dni)';
const SRC_FORECAST = 'Prognoza pogody (Open-Meteo)';

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

  // Okno naturalnego dojrzewania (senescencja): spadek NDVI jest wtedy NORMALNY
  // (żółknięcie łanu), a nie objaw choroby. Zboża i rzepak dojrzewają VII-VIII;
  // kukurydza/ziemniak/burak zostają zielone dłużej (zbiór IX-X). Bez monthOfYear
  // guard się nie aktywuje (zachowanie zachowawcze). Patrz audyt 1.3 / 2.14.
  const cerealLike = crop === 'wheat' || crop === 'barley' || crop === 'rapeseed';
  const isSenescenceWindow =
    input.monthOfYear !== undefined &&
    cerealLike &&
    (input.monthOfYear === 7 || input.monthOfYear === 8);

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
        'Jeśli masz nawadnianie — dobre okno dziś 18:00-22:00 albo jutro 5:30-9:00. Bez nawadniania rozważ oprysk spowalniający parowanie (antytranspirant) — dobór, dawkę i warunki potwierdź z etykietą (rejestr MRiRW), fazą uprawy i przepisami. Decyzję o zabiegu podejmujesz sam.',
      ruleId: 'drought-severe',
      why: [
        { label: 'NDVI', value: pl(ndviMean), threshold: 'poniżej 0,35', source: SRC_S2 },
        {
          label: 'Dni bez deszczu',
          value: String(daysWithoutRain),
          threshold: 'co najmniej 5',
          source: SRC_FORECAST,
        },
        {
          label: 'Parowanie (ET0)',
          value: `${pl(avgEt0Next7, 1)} mm/dzień`,
          threshold: 'powyżej 3',
          source: SRC_FORECAST,
        },
        ...(soilMoisturePct !== undefined
          ? [
              {
                label: 'Wilgotność gleby',
                value: `${pl(soilMoisturePct, 0)}%`,
                threshold: 'poniżej 25%',
                source: 'Model glebowy',
              },
            ]
          : []),
      ],
    };
  }

  // Spadek NDVI w oknie dojrzewania → to senescencja, NIE choroba. Nie zalecaj ŚOR.
  if (ndviDrop > 0.12 && daysWithoutRain < 4 && isSenescenceWindow) {
    return {
      severity: 'low',
      title: 'Naturalne dojrzewanie łanu',
      message: `NDVI spadł o ${ndviDrop.toFixed(2)}, ale to okres dojrzewania ${cropLabel} (lipiec-sierpień). Spadek to najprawdopodobniej naturalne żółknięcie łanu, nie choroba.`,
      action:
        'Nie ma potrzeby oprysku tylko z powodu spadku NDVI. Jeśli widzisz nietypowe plamy/przebarwienia — zrób zdjęcie (diagnoza z kamery). Planuj termin zbioru.',
      ruleId: 'senescence',
      why: [
        { label: 'Spadek NDVI', value: pl(ndviDrop), threshold: 'powyżej 0,12', source: SRC_S2 },
        {
          label: 'Miesiąc',
          value: input.monthOfYear === 7 ? 'lipiec' : 'sierpień',
          threshold: 'okno dojrzewania zbóż/rzepaku',
          source: 'Kalendarz agronomiczny',
        },
        {
          label: 'Dni bez deszczu',
          value: String(daysWithoutRain),
          threshold: 'poniżej 4 (susza wykluczona)',
          source: SRC_FORECAST,
        },
      ],
    };
  }

  // MEDIUM: spadek NDVI bez suszy poza dojrzewaniem → PODEJRZENIE choroby (do potwierdzenia)
  if (ndviDrop > 0.12 && daysWithoutRain < 4) {
    return {
      severity: 'medium',
      title: 'Możliwa choroba grzybowa',
      message: `NDVI spadł o ${ndviDrop.toFixed(2)} w ostatnim okresie przy normalnej wilgotności. Może wskazywać na infekcję ${cropLabel === 'pszenicy' ? '(rdza, mączniak, septorioza)' : '(plamistość liści, fuzarioza)'} — ale najpierw potwierdź.`,
      action:
        'Sprawdź pole wizualnie w 2-3 miejscach lub zrób zdjęcie do diagnozy z kamery. Fungicyd rozważ TYLKO po potwierdzeniu choroby — dobór substancji i dawkę potwierdź z aktualną etykietą (rejestr MRiRW), fazą uprawy i przepisami (nie stosuj „w ciemno"). Unikaj oprysku przy wietrze >15 km/h. Decyzję o zabiegu podejmujesz sam.',
      ruleId: 'disease-suspected',
      why: [
        { label: 'Spadek NDVI', value: pl(ndviDrop), threshold: 'powyżej 0,12', source: SRC_S2 },
        {
          label: 'Dni bez deszczu',
          value: String(daysWithoutRain),
          threshold: 'poniżej 4 — susza jako przyczyna wykluczona',
          source: SRC_FORECAST,
        },
        {
          label: 'Faza',
          value: 'poza oknem dojrzewania',
          threshold: 'spadek nie tłumaczy się żółknięciem łanu',
          source: 'Kalendarz agronomiczny',
        },
      ],
    };
  }

  // MEDIUM: umiarkowany stres suszowy
  if (daysWithoutRain >= 3 && ndviMean < 0.5) {
    return {
      severity: 'medium',
      title: 'Umiarkowany stres wodny',
      message: `${daysWithoutRain} dni bez deszczu, NDVI ${ndviMean.toFixed(2)}. Stan jeszcze nie krytyczny, ale warto działać wyprzedzająco.`,
      action:
        'Sprawdź wilgotność gleby łopatą (30 cm głębokości). Jeśli sucha: planuj nawadnianie w ciągu 48h albo rozważ oprysk antytranspirantem — dobór i dawkę potwierdź z etykietą (rejestr MRiRW); decyzję podejmujesz sam.',
      ruleId: 'water-stress-moderate',
      why: [
        {
          label: 'Dni bez deszczu',
          value: String(daysWithoutRain),
          threshold: 'co najmniej 3',
          source: SRC_FORECAST,
        },
        { label: 'NDVI', value: pl(ndviMean), threshold: 'poniżej 0,50', source: SRC_S2 },
      ],
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
      ruleId: 'condition-average',
      why: [
        { label: 'NDVI', value: pl(ndviMean), threshold: 'poniżej 0,55', source: SRC_S2 },
        {
          label: 'Susza',
          value: `${daysWithoutRain} dni bez deszczu`,
          threshold: 'progi suszy nieprzekroczone',
          source: SRC_FORECAST,
        },
      ],
    };
  }

  // NONE: wszystko OK
  return {
    severity: 'none',
    title: 'Pole w dobrej kondycji',
    message: `NDVI ${ndviMean.toFixed(2)}. ${cropLabel.charAt(0).toUpperCase() + cropLabel.slice(1)} zdrowa, brak konieczności interwencji.`,
    action: 'Kontynuuj standardowy plan. Kolejna analiza za 3-5 dni.',
    ruleId: 'healthy',
    why: [
      { label: 'NDVI', value: pl(ndviMean), threshold: 'co najmniej 0,55', source: SRC_S2 },
      {
        label: 'Susza',
        value: `${daysWithoutRain} dni bez deszczu`,
        threshold: 'progi suszy nieprzekroczone',
        source: SRC_FORECAST,
      },
      ...(ndviPrevious !== undefined
        ? [
            {
              label: 'Zmiana NDVI',
              value: ndviDrop > 0 ? `spadek ${pl(ndviDrop)}` : `wzrost ${pl(Math.abs(ndviDrop))}`,
              threshold: 'brak istotnego spadku (próg 0,12)',
              source: SRC_S2,
            },
          ]
        : []),
    ],
  };
}
