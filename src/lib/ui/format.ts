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
