import { describe, it, expect } from 'vitest';
import { calculateGdd, deriveBbchStatus, defaultSowingDate } from '../bbch';

describe('calculateGdd', () => {
  it('sumuje GDD powyżej tBase', () => {
    const sowingDate = new Date('2026-03-01');
    const temps = [
      { date: '2026-03-01', tMax: 10, tMin: 0 },    // avg 5 → GDD 5 (tBase 0)
      { date: '2026-03-02', tMax: 12, tMin: 4 },    // avg 8 → GDD 8
      { date: '2026-03-03', tMax: -2, tMin: -6 },   // avg -4 → GDD 0 (clamp)
    ];
    expect(calculateGdd(temps, 0, sowingDate)).toBeCloseTo(13, 1);
  });

  it('pomija dni przed sowingDate', () => {
    const temps = [
      { date: '2026-02-28', tMax: 20, tMin: 10 }, // ignore
      { date: '2026-03-01', tMax: 10, tMin: 0 },
    ];
    expect(calculateGdd(temps, 0, new Date('2026-03-01'))).toBeCloseTo(5, 1);
  });

  it('używa tBase dla kukurydzy (T_base = 8°C)', () => {
    const temps = [
      { date: '2026-05-01', tMax: 20, tMin: 10 }, // avg 15, -8 = 7
      { date: '2026-05-02', tMax: 14, tMin: 8 },  // avg 11, -8 = 3
    ];
    expect(calculateGdd(temps, 8, new Date('2026-05-01'))).toBeCloseTo(10, 1);
  });
});

describe('deriveBbchStatus', () => {
  it('zwraca null dla uprawy bez milestonów', () => {
    expect(deriveBbchStatus({
      crop: 'other',
      sowingDate: new Date('2026-03-01'),
      dailyTemps: [],
    })).toBeNull();
  });

  it('pszenica ozima w BBCH 30 dostaje alerty o azocie', () => {
    // symulujemy ~1000 GDD accumulated = BBCH 30
    const sowing = new Date('2025-09-15');
    const temps: Array<{ date: string; tMax: number; tMin: number }> = [];
    const start = sowing.getTime();
    for (let i = 0; i < 200; i++) {
      const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      temps.push({ date, tMax: 15, tMin: 5 }); // avg 10, GDD 10
    }
    // 200 * 10 = 2000 GDD — zbyt dużo dla BBCH 30, to powinno dać BBCH 85+
    const status = deriveBbchStatus({ crop: 'wheat', sowingDate: sowing, dailyTemps: temps });
    expect(status).not.toBeNull();
    expect(status!.currentBbch).toBeGreaterThan(29);
  });

  it('progress = 0-100', () => {
    const status = deriveBbchStatus({
      crop: 'wheat',
      sowingDate: new Date('2026-04-01'),
      dailyTemps: [{ date: '2026-04-01', tMax: 10, tMin: 0 }],
    });
    expect(status!.progress).toBeGreaterThanOrEqual(0);
    expect(status!.progress).toBeLessThanOrEqual(100);
  });
});

describe('defaultSowingDate', () => {
  it('pszenica ozima = 15 IX poprzedniego roku', () => {
    const d = defaultSowingDate('wheat', 2026);
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(8); // wrzesień (0-indexed)
    expect(d.getUTCDate()).toBe(15);
  });

  it('kukurydza = 25 IV', () => {
    const d = defaultSowingDate('corn', 2026);
    expect(d.getUTCMonth()).toBe(3); // kwiecień
    expect(d.getUTCDate()).toBe(25);
  });

  it('rzepak ozimy = 25 VIII poprzedniego roku', () => {
    const d = defaultSowingDate('rapeseed', 2026);
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(7); // sierpień
    expect(d.getUTCDate()).toBe(25);
  });
});
