/** Freshness describes the measurement, never the agronomic condition of a field. */
export const RECENT_READING_DAYS = 14;
const DAY_MS = 86_400_000;

export interface FieldReading {
  ndviMean: number | null;
  ndviObservedAt: string | null;
  ndviSource: string | null;
}

export type ReadingStatus = 'recent' | 'older' | 'missing' | 'demo' | 'archive' | 'unknown';
export type ReadingFilter = 'all' | 'recent' | 'review' | 'demo';

export function isValidNdvi(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= -1 && value <= 1;
}

export function getReadingStatus(field: FieldReading, asOf: string): ReadingStatus {
  if (field.ndviSource === 'mock') return 'demo';
  if (field.ndviMean === null) return 'missing';
  if (!isValidNdvi(field.ndviMean)) return 'unknown';
  // Historical backfill uses a synthetic monthly date, not the date of a scene.
  if (field.ndviSource === 'sentinel-2-history') return 'archive';
  if (field.ndviSource !== 'sentinel-2' || !field.ndviObservedAt) return 'unknown';
  const age = Date.parse(asOf) - Date.parse(field.ndviObservedAt);
  if (!Number.isFinite(age) || age < 0) return 'unknown';
  return age <= RECENT_READING_DAYS * DAY_MS ? 'recent' : 'older';
}

export function matchesReadingFilter(status: ReadingStatus, filter: ReadingFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'review')
    return (
      status === 'older' || status === 'missing' || status === 'unknown' || status === 'archive'
    );
  return status === filter;
}

const PRIORITY: Record<ReadingStatus, number> = {
  missing: 0,
  unknown: 0,
  older: 1,
  archive: 2,
  demo: 3,
  recent: 4,
};

export function compareReadingPriority(a: FieldReading, b: FieldReading, asOf: string): number {
  const aStatus = getReadingStatus(a, asOf);
  const bStatus = getReadingStatus(b, asOf);
  const priority = PRIORITY[aStatus] - PRIORITY[bStatus];
  if (priority) return priority;
  // Missing or invalid dates should never introduce NaN into Array.sort.
  if (aStatus === 'missing' || aStatus === 'unknown' || aStatus === 'demo' || aStatus === 'archive')
    return 0;
  return Date.parse(a.ndviObservedAt!) - Date.parse(b.ndviObservedAt!);
}

interface StoredReading {
  fieldId: string;
  ndviMean: number;
  observedAt: Date;
  source: string;
}

function sourcePriority(source: string): number {
  switch (source) {
    case 'sentinel-2':
      return 0;
    case 'sentinel-2-history':
      return 1;
    case 'mock':
      return 2;
    default:
      return 3;
  }
}

/** A monthly composite or a demo must never conceal an actual satellite scene. */
export function selectMonitoringReadings<T extends StoredReading>(readings: T[]): Map<string, T> {
  const selected = new Map<string, T>();
  for (const candidate of readings) {
    const current = selected.get(candidate.fieldId);
    const priority = current
      ? sourcePriority(candidate.source) - sourcePriority(current.source)
      : -1;
    if (!current || priority < 0 || (priority === 0 && candidate.observedAt > current.observedAt)) {
      selected.set(candidate.fieldId, candidate);
    }
  }
  return selected;
}

/** Searching Polish field/crop names also works without typing diacritics. */
export function normalizeFieldSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
}
