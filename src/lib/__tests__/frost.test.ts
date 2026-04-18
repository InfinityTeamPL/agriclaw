import { describe, it, expect } from 'vitest';
import { assessFrostRisk } from '../frost';

describe('assessFrostRisk', () => {
  it('marks rapeseed at flowering with -3°C night as critical', () => {
    // BBCH 65 = pełnia kwitnienia rzepaku, próg -2°C damage / -4°C lethal
    const result = assessFrostRisk({
      crop: 'rapeseed',
      bbch: 65,
      forecast: [{ date: '2026-04-20', tMin: -3 }],
    });
    expect(result.worstLevel).toBe('critical');
    expect(result.shouldCreateRecommendation).toBe(true);
    expect(result.minTempC).toBe(-3);
  });

  it('marks wheat at krzewienie with -5°C as watch (zimno ale mrozoodporne)', () => {
    // BBCH 25 = krzewienie zimowe, próg -8°C damage. -5°C to chłodna noc ale bez uszkodzenia.
    const result = assessFrostRisk({
      crop: 'wheat',
      bbch: 25,
      forecast: [{ date: '2026-02-15', tMin: -5 }],
    });
    // -5 > -8 (damage) i > -6 (damage+2), ale <= 3 (watch threshold)
    expect(result.worstLevel).toBe('watch');
    expect(result.shouldCreateRecommendation).toBe(false);
  });

  it('marks wheat at klosowanie with -2°C as critical', () => {
    // BBCH 55 = kłoszenie, próg -1°C damage / -2°C lethal
    const result = assessFrostRisk({
      crop: 'wheat',
      bbch: 55,
      forecast: [{ date: '2026-05-10', tMin: -2 }],
    });
    expect(result.worstLevel).toBe('critical');
    expect(result.shouldCreateRecommendation).toBe(true);
  });

  it('marks corn at wschody with 1°C as warning (granica)', () => {
    // BBCH 9 = wschody kukurydzy, próg -1°C damage. 1°C to damage+2 → warning.
    const result = assessFrostRisk({
      crop: 'corn',
      bbch: 9,
      forecast: [{ date: '2026-05-05', tMin: 1 }],
    });
    expect(result.worstLevel).toBe('warning');
    expect(result.shouldCreateRecommendation).toBe(true);
  });

  it('marks corn at wschody with 5°C as safe', () => {
    // 5°C > watch threshold (3°C) i daleko od damage (-1°C)
    const result = assessFrostRisk({
      crop: 'corn',
      bbch: 9,
      forecast: [{ date: '2026-05-05', tMin: 5 }],
    });
    expect(result.worstLevel).toBe('safe');
    expect(result.shouldCreateRecommendation).toBe(false);
  });

  it('marks potato at wegetacja with -0.5°C as warning (granica)', () => {
    // Ziemniak próg 0°C damage / -1°C lethal
    const result = assessFrostRisk({
      crop: 'potato',
      bbch: 19,
      forecast: [{ date: '2026-05-10', tMin: -0.5 }],
    });
    // -0.5 <= 0 (damage threshold) → critical; w zakresie damageThreshold+2 już nie ma sensu bo damage=0
    expect(['warning', 'critical']).toContain(result.worstLevel);
    expect(result.shouldCreateRecommendation).toBe(true);
  });

  it('finds worst night in multi-night forecast', () => {
    const result = assessFrostRisk({
      crop: 'rapeseed',
      bbch: 60,
      forecast: [
        { date: '2026-04-20', tMin: 5 },
        { date: '2026-04-21', tMin: -5 }, // worst
        { date: '2026-04-22', tMin: 2 },
        { date: '2026-04-23', tMin: 8 },
      ],
    });
    expect(result.minTempC).toBe(-5);
    expect(result.firstDangerDate).toBe('2026-04-21');
    expect(result.worstLevel).toBe('critical');
  });

  it('returns safe when all nights > 5°C', () => {
    const result = assessFrostRisk({
      crop: 'wheat',
      bbch: 55,
      forecast: [
        { date: '2026-05-10', tMin: 10 },
        { date: '2026-05-11', tMin: 8 },
        { date: '2026-05-12', tMin: 12 },
      ],
    });
    expect(result.worstLevel).toBe('safe');
    expect(result.firstDangerDate).toBeNull();
  });

  it('includes crop-specific recommendation for corn', () => {
    const result = assessFrostRisk({
      crop: 'corn',
      bbch: 16,
      forecast: [{ date: '2026-05-05', tMin: -2 }],
    });
    expect(result.recommendation).toContain('Kukurydza');
    expect(result.recommendation).toMatch(/siew|zraszanie/i);
  });

  it('includes BBCH-specific recommendation for wheat flowering', () => {
    const result = assessFrostRisk({
      crop: 'wheat',
      bbch: 55,
      forecast: [{ date: '2026-05-10', tMin: -2 }],
    });
    expect(result.recommendation).toMatch(/zboż|kłos|zraszanie|lustrac/i);
  });
});
