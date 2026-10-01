import { describe, it, expect } from 'vitest';
import {
  computeNdviStats,
  classifyNdvi,
  ndviColorHex,
  describeNdvi,
  cropStage,
} from '../ndvi';
import { interpretNdre } from '../indices';

describe('computeNdviStats', () => {
  it('oblicza średnią, min, max pomijając NaN', () => {
    const values = new Float32Array([0.5, 0.7, NaN, 0.3]);
    const stats = computeNdviStats(values);
    expect(stats.mean).toBeCloseTo(0.5, 2);
    expect(stats.min).toBeCloseTo(0.3, 5);
    expect(stats.max).toBeCloseTo(0.7, 5);
    expect(stats.validCount).toBe(3);
    expect(stats.stddev).toBeGreaterThan(0);
  });

  it('zero-stats dla samych NaN', () => {
    const stats = computeNdviStats(new Float32Array([NaN, NaN]));
    expect(stats).toEqual({
      mean: 0,
      min: 0,
      max: 0,
      validCount: 0,
      stddev: 0,
    });
  });

  it('stddev 0 dla stałej wartości', () => {
    const stats = computeNdviStats(new Float32Array([0.5, 0.5, 0.5]));
    expect(stats.stddev).toBeCloseTo(0, 5);
  });
});

describe('classifyNdvi', () => {
  it('klasyfikuje poprawnie progi', () => {
    expect(classifyNdvi(0.1)).toBe('bare');
    expect(classifyNdvi(0.25)).toBe('stressed');
    expect(classifyNdvi(0.45)).toBe('moderate');
    expect(classifyNdvi(0.65)).toBe('healthy');
    expect(classifyNdvi(0.8)).toBe('very-healthy');
  });
});

describe('ndviColorHex', () => {
  it('zwraca kolor hex dla każdej klasy', () => {
    expect(ndviColorHex(0.1)).toBe('#7f1d1d');
    expect(ndviColorHex(0.5)).toBe('#facc15');
    expect(ndviColorHex(0.8)).toBe('#14532d');
  });

  it('zwraca szary dla NaN', () => {
    expect(ndviColorHex(NaN)).toBe('#1f2937');
  });
});

describe('describeNdvi', () => {
  it('używa polskiej nazwy uprawy', () => {
    const description = describeNdvi(0.65, 'wheat');
    expect(description).toContain('pszenica');
  });

  it('opisuje stres dla niskiego NDVI', () => {
    expect(describeNdvi(0.2, 'corn')).toMatch(/stres/i);
  });
});

describe('interpretacja zależna od fazy (regresja 10.2026)', () => {
  const at = new Date('2026-10-01T12:00:00Z');

  it('pszenica 2 tyg. po siewie, NDVI 0,46 → „we wschodach", nie „możliwa interwencja"', () => {
    const d = describeNdvi(0.46, 'wheat', { sowingDate: '2026-09-15', at });
    expect(d).toMatch(/wschodach/);
    expect(d).not.toMatch(/interwencja/);
  });

  it('bez kontekstu — zachowanie historyczne', () => {
    expect(describeNdvi(0.46, 'wheat')).toMatch(/przeciętnej kondycji/);
  });

  it('NDRE jesienią po siewie nie podpowiada mocznika', () => {
    const t = interpretNdre(0.25, 'wheat', { sowingDate: '2026-09-15', at });
    expect(t).not.toMatch(/mocznik/i);
  });

  it('styczeń, ozimina → spoczynek zimowy, bez azotu', () => {
    const jan = new Date('2027-01-15T12:00:00Z');
    expect(cropStage('wheat', { sowingDate: '2026-09-15', at: jan })).toBe('dormancy');
    expect(interpretNdre(0.15, 'wheat', { sowingDate: '2026-09-15', at: jan })).toMatch(/Spoczynek/);
  });

  it('maj, pszenica ozima → growth (klasyczne progi wracają)', () => {
    const may = new Date('2027-05-10T12:00:00Z');
    expect(cropStage('wheat', { sowingDate: '2026-09-15', at: may })).toBe('growth');
    expect(interpretNdre(0.25, 'wheat', { sowingDate: '2026-09-15', at: may })).toMatch(/mocznik/);
  });

  it('kukurydza 3 tyg. po siewie → establishment; 2 mies. → growth', () => {
    expect(cropStage('corn', { sowingDate: '2026-04-25', at: new Date('2026-05-15T12:00:00Z') })).toBe('establishment');
    expect(cropStage('corn', { sowingDate: '2026-04-25', at: new Date('2026-06-25T12:00:00Z') })).toBe('growth');
  });
});
