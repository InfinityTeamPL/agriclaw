import { describe, it, expect } from 'vitest';
import {
  computeNdviStats,
  classifyNdvi,
  ndviColorHex,
  describeNdvi,
} from '../ndvi';

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
