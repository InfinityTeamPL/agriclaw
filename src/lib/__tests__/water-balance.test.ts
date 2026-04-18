import { describe, it, expect } from 'vitest';
import { calculateWaterBalance, kcAtBbch } from '../water-balance';

describe('kcAtBbch', () => {
  it('zwraca kcIni dla BBCH 0', () => {
    expect(kcAtBbch('wheat', 0)).toBe(0.4);
  });

  it('zwraca kcMid dla BBCH w środku wegetacji', () => {
    // Pszenica: bbchToMid=40, bbchToEnd=70 — między nimi kcMid=1.15
    expect(kcAtBbch('wheat', 55)).toBe(1.15);
  });

  it('interpoluje kcIni -> kcMid', () => {
    // Pszenica BBCH 20 = połowa drogi do 40 → Kc = 0.4 + 0.5 * (1.15-0.4) = 0.775
    expect(kcAtBbch('wheat', 20)).toBeCloseTo(0.775, 2);
  });

  it('interpoluje kcMid -> kcEnd', () => {
    // Pszenica BBCH 79 = (79-70)/(89-70) = 9/19 ≈ 0.474 drogi do kcEnd
    // Kc = 1.15 + 0.474 * (0.4-1.15) = 1.15 - 0.355 = 0.795
    expect(kcAtBbch('wheat', 79)).toBeCloseTo(0.795, 2);
  });

  it('kukurydza ma wyższy kcMid niż pszenica', () => {
    expect(kcAtBbch('corn', 55)).toBeGreaterThan(kcAtBbch('wheat', 55));
  });
});

describe('calculateWaterBalance', () => {
  it('oblicza dodatni bilans gdy opady > ETc', () => {
    const result = calculateWaterBalance({
      crop: 'wheat',
      bbch: 30,
      areaHectares: 10,
      days: [
        { date: '2026-04-01', rainMm: 10, et0Mm: 3 },
        { date: '2026-04-02', rainMm: 8, et0Mm: 3 },
        { date: '2026-04-03', rainMm: 0, et0Mm: 4 },
      ],
    });
    expect(result.totalRainMm).toBe(18);
    expect(result.netBalanceMm).toBeGreaterThan(0);
    expect(result.status).toBe('surplus');
    expect(result.irrigationSuggestionMm).toBe(0);
  });

  it('wykrywa suszę gdy ETc >> opady', () => {
    const result = calculateWaterBalance({
      crop: 'wheat',
      bbch: 55, // kcMid=1.15
      areaHectares: 10,
      days: Array.from({ length: 14 }, (_, i) => ({
        date: `2026-04-${String(i + 1).padStart(2, '0')}`,
        rainMm: 0,
        et0Mm: 5, // 5mm ET0 × 1.15 Kc = 5.75 mm ETc/dzień × 14 = 80.5 mm deficyt
      })),
    });
    expect(result.netBalanceMm).toBeLessThan(-50);
    expect(['drought', 'severe-drought']).toContain(result.status);
    expect(result.irrigationSuggestionMm).toBeGreaterThan(0);
    expect(result.irrigationTotalM3).toBeGreaterThan(0);
  });

  it('kumulatywny bilans rośnie z każdym dniem', () => {
    // BBCH 55 dla pszenicy → Kc=1.15 (kcMid, stała)
    const result = calculateWaterBalance({
      crop: 'wheat',
      bbch: 55,
      areaHectares: 5,
      days: [
        { date: '2026-04-01', rainMm: 5, et0Mm: 2 }, // ETc=2.3 → +2.7
        { date: '2026-04-02', rainMm: 3, et0Mm: 2 }, // +0.7 → cum 3.4
        { date: '2026-04-03', rainMm: 0, et0Mm: 3 }, // -3.45 → cum -0.05
      ],
    });
    expect(result.daily[0].cumulativeMm).toBeCloseTo(2.7, 1);
    expect(result.daily[1].cumulativeMm).toBeCloseTo(3.4, 1);
    expect(result.daily[2].cumulativeMm).toBeCloseTo(-0.05, 1);
  });

  it('m³ nawodnienia = mm × ha × 10', () => {
    const result = calculateWaterBalance({
      crop: 'corn',
      bbch: 55,
      areaHectares: 20,
      days: Array.from({ length: 14 }, (_, i) => ({
        date: `2026-07-${String(i + 1).padStart(2, '0')}`,
        rainMm: 0,
        et0Mm: 6,
      })),
    });
    // Deficyt ~ 100 mm, suggestion = 60% * 100 = 60 mm
    // m³ = 60 × 20 × 10 = 12000
    expect(result.irrigationTotalM3).toBe(result.irrigationSuggestionMm * 20 * 10);
  });
});
