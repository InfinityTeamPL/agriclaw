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
  });
}

export interface SeverityStyle {
  label: string;
  pill: string;
}

export function severityStyle(severity: string): SeverityStyle {
  switch (severity) {
    case 'high':
      return {
        label: 'Pilne',
        pill: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'medium':
      return {
        label: 'Ważne',
        pill: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'low':
      return {
        label: 'Do uwagi',
        pill: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      };
    case 'none':
    default:
      return {
        label: 'OK',
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
  }
}
