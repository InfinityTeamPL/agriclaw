// Wspólne formattery UI dla AgriClaw dashboardu.
// - cropLabel: mapowanie slug -> etykieta PL
// - formatHa: liczba hektarów z 2 miejsc po przecinku
// - formatDatePL: krótka data po polsku
// - severityStyle: pill z kolorem dla severity rekomendacji

export const CROPS = [
  { value: 'wheat', label: 'Pszenica' },
  { value: 'corn', label: 'Kukurydza' },
  { value: 'rapeseed', label: 'Rzepak' },
  { value: 'barley', label: 'Jęczmień' },
  { value: 'potato', label: 'Ziemniaki' },
  { value: 'rye', label: 'Żyto' },
  { value: 'oats', label: 'Owies' },
  { value: 'sugarbeet', label: 'Burak cukrowy' },
  { value: 'other', label: 'Inna' },
] as const;

const cropMap = new Map(CROPS.map((c) => [c.value, c.label]));

export function cropLabel(slug: string): string {
  return cropMap.get(slug as (typeof CROPS)[number]['value']) ?? slug;
}

/**
 * Polska odmiana rzeczownika po liczebniku: pluralPL(4, 'pole', 'pola', 'pól') → 'pola'.
 * Reguła: 1 → one; końcówka 2–4 poza 12–14 → few; reszta → many.
 */
export function pluralPL(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  if (abs === 1) return one;
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

export function formatHa(ha: number): string {
  if (!Number.isFinite(ha)) return '0';
  return ha.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Dzisiejsza data (YYYY-MM-DD) wg czasu w Polsce, z opcjonalnym przesunięciem o dni.
 * NIE używaj new Date().toISOString().slice(0, 10) — to data UTC i między 0:00 a 2:00
 * w Polsce wskazuje „wczoraj" (np. domyślna data zabiegu w księdze polowej).
 */
export function todayIsoPL(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
}

export function formatDatePL(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    // Przypięta strefa — inaczej serwer (UTC) i klient (Europe/Warsaw) renderują
    // różną datę koło północy → hydration mismatch w React.
    timeZone: 'Europe/Warsaw',
  });
}

export function formatDateTimePL(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // Przypięta strefa — spójny wynik serwer/klient (bez hydration mismatch) i
    // godziny w czasie lokalnym rolnika zamiast UTC.
    timeZone: 'Europe/Warsaw',
  });
}

export interface SeverityStyle {
  label: string;
  pill: string;
}

export function severityStyle(severity: string): SeverityStyle {
  // Kolory z tokenów sygnałów agronomicznych — te same co dane na mapie/wykresach.
  switch (severity) {
    case 'high':
      return {
        label: 'Pilne',
        pill: 'bg-destructive/10 text-destructive border-destructive/30',
      };
    case 'medium':
      return {
        label: 'Ważne',
        pill: 'bg-signal-heat/10 text-signal-heat border-signal-heat/30',
      };
    case 'low':
      return {
        label: 'Do uwagi',
        pill: 'bg-signal-frost/10 text-signal-frost border-signal-frost/30',
      };
    case 'none':
    default:
      return {
        label: 'OK',
        pill: 'bg-signal-healthy/10 text-signal-healthy border-signal-healthy/30',
      };
  }
}

/**
 * Liczba wpisana przez polskiego użytkownika: akceptuje przecinek i kropkę
 * dziesiętną oraz spacje tysięcy („2,5", „2.5", „1 250,5"). Zwraca null dla
 * pustego/niepoprawnego wejścia — NIGDY NaN (NaN po cichu gubił dawkę
 * w księdze polowej, gdy rolnik wpisał „2,5").
 */
export function parsePlNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = raw.replace(/[\s\u00a0]/g, '').replace(',', '.');
  if (!s || !/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Liczba po polsku bez zbędnych zer: 2,5 · 3 · 0,075. */
export function formatNumberPL(n: number, maxFractionDigits = 3): string {
  return n.toLocaleString('pl-PL', { maximumFractionDigits: maxFractionDigits });
}

/** Indeks spektralny (NDVI, NDRE…) po polsku: 0,46 zamiast 0.46 — spójnie z „0,61 ha". */
export function formatIndexPL(n: number): string {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
