import { describe, expect, it } from 'vitest';
import {
  compareReadingPriority,
  getReadingStatus,
  isValidNdvi,
  matchesReadingFilter,
  normalizeFieldSearch,
  selectMonitoringReadings,
  type FieldReading,
} from '@/lib/ui/field-monitoring';

const asOf = '2026-10-07T10:00:00Z';
const reading: FieldReading = {
  ndviMean: 0.46,
  ndviObservedAt: '2026-10-06T10:00:00Z',
  ndviSource: 'sentinel-2',
};

describe('field measurement trust and freshness', () => {
  it('uses the observation date, including the exact 14-day boundary', () => {
    expect(getReadingStatus(reading, asOf)).toBe('recent');
    expect(getReadingStatus({ ...reading, ndviObservedAt: '2026-09-23T10:00:00Z' }, asOf)).toBe(
      'recent'
    );
    expect(getReadingStatus({ ...reading, ndviObservedAt: '2026-09-23T09:59:59Z' }, asOf)).toBe(
      'older'
    );
  });

  it('never counts a fresh simulated reading as an actual satellite measurement', () => {
    const demo = getReadingStatus({ ...reading, ndviSource: 'mock' }, asOf);
    expect(demo).toBe('demo');
    expect(matchesReadingFilter(demo, 'recent')).toBe(false);
    expect(matchesReadingFilter(demo, 'demo')).toBe(true);
  });

  it.each([
    { ...reading, ndviObservedAt: null },
    { ...reading, ndviObservedAt: 'invalid' },
    { ...reading, ndviObservedAt: '2026-10-08T10:00:00Z' },
    { ...reading, ndviSource: null },
    { ...reading, ndviSource: 'unknown-source' },
    { ...reading, ndviMean: NaN },
    { ...reading, ndviMean: Infinity },
    { ...reading, ndviMean: 1.1 },
  ])('does not turn incomplete or invalid metadata into a fresh reading: %j', (field) => {
    expect(getReadingStatus(field, asOf)).toBe('unknown');
    expect(matchesReadingFilter(getReadingStatus(field, asOf), 'review')).toBe(true);
  });

  it('treats missing data separately and keeps valid zero NDVI', () => {
    expect(getReadingStatus({ ...reading, ndviMean: null }, asOf)).toBe('missing');
    expect(getReadingStatus({ ...reading, ndviMean: 0 }, asOf)).toBe('recent');
  });

  it('puts unmeasured fields and the oldest readings before recent data', () => {
    const fields = [
      reading,
      { ...reading, ndviSource: 'mock' },
      { ...reading, ndviObservedAt: '2026-09-01T10:00:00Z' },
      { ...reading, ndviMean: null },
    ];
    const sorted = [...fields].sort((a, b) => compareReadingPriority(a, b, asOf));
    expect(sorted.map((field) => getReadingStatus(field, asOf))).toEqual([
      'missing',
      'older',
      'demo',
      'recent',
    ]);
    expect(fields[0]).toBe(reading);
  });

  it('accepts Polish field names entered without diacritics', () => {
    expect(normalizeFieldSearch('  Łąka Żółta  ')).toBe('laka zolta');
    expect(normalizeFieldSearch('JĘCZMIEŃ')).toBe('jeczmien');
  });

  it('keeps monthly composites out of recent coverage even with a future synthetic date', () => {
    const status = getReadingStatus(
      { ...reading, ndviSource: 'sentinel-2-history', ndviObservedAt: '2026-10-15T00:00:00Z' },
      asOf
    );
    expect(status).toBe('archive');
    expect(matchesReadingFilter(status, 'recent')).toBe(false);
    expect(matchesReadingFilter(status, 'review')).toBe(true);
  });

  it('prefers actual satellite scenes over newer monthly composites and demo records', () => {
    const actual = {
      fieldId: 'one',
      source: 'sentinel-2',
      observedAt: new Date('2026-10-01'),
      ndviMean: 0.46,
    };
    const newerActual = { ...actual, observedAt: new Date('2026-10-05') };
    const composite = {
      ...actual,
      source: 'sentinel-2-history',
      observedAt: new Date('2026-10-15'),
    };
    const demo = { ...actual, source: 'mock', observedAt: new Date('2026-10-20') };
    expect(selectMonitoringReadings([demo, composite, actual, newerActual]).get('one')).toBe(
      newerActual
    );
    expect(selectMonitoringReadings([newerActual, demo, actual, composite]).get('one')).toBe(
      newerActual
    );
    expect(selectMonitoringReadings([{ ...demo, fieldId: 'two' }, composite]).get('one')).toBe(
      composite
    );
    expect(selectMonitoringReadings([demo]).get('one')).toBe(demo);
  });

  it('uses a shared valid NDVI range for display and sorting', () => {
    expect(isValidNdvi(-1)).toBe(true);
    expect(isValidNdvi(0)).toBe(true);
    expect(isValidNdvi(1)).toBe(true);
    for (const value of [null, NaN, Infinity, -1.1, 1.1]) expect(isValidNdvi(value)).toBe(false);
  });
});
