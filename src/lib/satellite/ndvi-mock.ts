// Mock NDVI generator — używany kiedy brak CDSE credentials (dev / demo).
// Generujemy wiarygodne statystyki na podstawie:
// - miesiąca roku (sezon wegetacji)
// - uprawy (pszenica vs kukurydza vs rzepak mają różny cykl)
// - szerokości geograficznej (chłodniej = późniejsza wegetacja)
// - deterministycznego ziarna (ten sam pole → te same wartości — stabilne dla demo)

interface MockNdviInput {
  fieldId: string;
  crop: string;
  lat: number;
  lon: number;
  date?: Date;
}

export interface MockNdviStats {
  mean: number;
  min: number;
  max: number;
  validCount: number;
  stddev: number;
  mock: true;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 16777619;
  }
  return (h >>> 0) / 4294967296;
}

function cropPhase(crop: string, monthOfYear: number): number {
  // Zwraca "idealny NDVI" dla tej uprawy w tym miesiącu (0..1)
  const phaseCurves: Record<string, number[]> = {
    // miesiąc 1..12 (index 0..11)
    wheat: [0.15, 0.2, 0.35, 0.55, 0.72, 0.78, 0.6, 0.25, 0.2, 0.25, 0.3, 0.25], // ozima
    rye: [0.18, 0.22, 0.35, 0.55, 0.7, 0.72, 0.55, 0.22, 0.2, 0.3, 0.32, 0.25],
    barley: [0.12, 0.15, 0.3, 0.5, 0.7, 0.68, 0.4, 0.2, 0.15, 0.2, 0.25, 0.2],
    oats: [0.1, 0.12, 0.15, 0.3, 0.55, 0.75, 0.65, 0.3, 0.2, 0.2, 0.15, 0.12],
    corn: [0.1, 0.1, 0.12, 0.15, 0.3, 0.55, 0.75, 0.8, 0.65, 0.3, 0.15, 0.12], // jara
    rapeseed: [0.25, 0.35, 0.5, 0.7, 0.8, 0.45, 0.2, 0.15, 0.3, 0.45, 0.4, 0.3],
    potato: [0.1, 0.1, 0.1, 0.15, 0.35, 0.6, 0.75, 0.7, 0.4, 0.2, 0.12, 0.1],
    sugarbeet: [0.1, 0.1, 0.15, 0.25, 0.5, 0.7, 0.8, 0.78, 0.65, 0.45, 0.2, 0.12],
    other: [0.3, 0.3, 0.35, 0.45, 0.55, 0.6, 0.55, 0.45, 0.4, 0.35, 0.3, 0.3],
  };
  const curve = phaseCurves[crop] ?? phaseCurves.other;
  const idx = Math.max(0, Math.min(11, monthOfYear - 1));
  return curve[idx];
}

export function generateMockNdvi(input: MockNdviInput): MockNdviStats {
  const date = input.date ?? new Date();
  const month = date.getMonth() + 1;

  // Deterministyczne variacje per-pole (stabilne między wywołaniami)
  const fieldHash = hashString(input.fieldId);

  // Ideał dla uprawy + zdjęcia. Dodajemy szum per-pole (uprawa/gleba gorzej/lepiej)
  const ideal = cropPhase(input.crop, month);
  const bias = (fieldHash - 0.5) * 0.2; // -0.1 .. +0.1 per-pole
  const mean = Math.max(0.05, Math.min(0.9, ideal + bias));

  // Rozrzut w obrębie pola — większy dla chorego, mniejszy dla zdrowego
  const stddev = 0.05 + (0.9 - mean) * 0.1;

  // Min/max z rozsądną odległością od średniej
  const min = Math.max(0.0, mean - stddev * 2.5);
  const max = Math.min(1.0, mean + stddev * 2.0);

  return {
    mean,
    min,
    max,
    validCount: 512 * 512,
    stddev,
    mock: true,
  };
}

export function isCopernicusConfigured(): boolean {
  return Boolean(process.env.CDSE_CLIENT_ID && process.env.CDSE_CLIENT_SECRET);
}
