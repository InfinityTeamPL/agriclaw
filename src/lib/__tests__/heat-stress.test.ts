import { describe, it, expect } from 'vitest';
import { assessHeatStress } from '../heat-stress';

describe('assessHeatStress', () => {
  it('kukurydza w pyleniu przy 36°C — critical', () => {
    const r = assessHeatStress({
      crop: 'corn',
      bbch: 63,
      forecast: [{ date: '2026-07-20', tMax: 36 }],
    });
    expect(r.worstLevel).toBe('critical');
    expect(r.shouldCreateRecommendation).toBe(true);
    expect(r.recommendation).toMatch(/kukurydza|pyłek|pylenie/i);
  });

  it('rzepak w kwitnieniu przy 30°C — critical (próg 27 stress, 30 critical)', () => {
    const r = assessHeatStress({
      crop: 'rapeseed',
      bbch: 65,
      forecast: [{ date: '2026-05-15', tMax: 30 }],
    });
    expect(r.worstLevel).toBe('critical');
    expect(r.recommendation).toMatch(/rzepak|aborcja|kwit/i);
  });

  it('pszenica w napełnianiu przy 33°C (>30 stress, <34 critical) = warning', () => {
    const r = assessHeatStress({
      crop: 'wheat',
      bbch: 77,
      forecast: [{ date: '2026-07-10', tMax: 33 }],
    });
    expect(r.worstLevel).toBe('warning');
  });

  it('ziemniak w tuberyzacji przy 26°C — warning (próg 25°C)', () => {
    const r = assessHeatStress({
      crop: 'potato',
      bbch: 65,
      forecast: [{ date: '2026-07-15', tMax: 26 }],
    });
    expect(r.worstLevel).toBe('warning');
  });

  it('consecutive stress days liczy poprawnie', () => {
    const r = assessHeatStress({
      crop: 'corn',
      bbch: 63,
      forecast: [
        { date: '2026-07-20', tMax: 36 }, // critical
        { date: '2026-07-21', tMax: 34 }, // warning
        { date: '2026-07-22', tMax: 33 }, // warning
        { date: '2026-07-23', tMax: 28 }, // safe — przerywa serię
        { date: '2026-07-24', tMax: 36 }, // critical — nowa seria
      ],
    });
    expect(r.consecutiveStressDays).toBe(3); // pierwsza seria 3 dni
  });

  it('warning 3+ dni pod rząd tworzy Recommendation', () => {
    const r = assessHeatStress({
      crop: 'wheat',
      bbch: 77,
      forecast: [
        { date: '2026-07-10', tMax: 33 }, // warning
        { date: '2026-07-11', tMax: 32 }, // warning
        { date: '2026-07-12', tMax: 31 }, // warning
      ],
    });
    expect(r.shouldCreateRecommendation).toBe(true);
  });

  it('warning 1 dzień NIE tworzy Recommendation', () => {
    const r = assessHeatStress({
      crop: 'wheat',
      bbch: 77,
      forecast: [
        { date: '2026-07-10', tMax: 33 }, // warning
        { date: '2026-07-11', tMax: 28 }, // safe
      ],
    });
    expect(r.shouldCreateRecommendation).toBe(false);
  });

  it('bezpieczne prognozy — worstLevel=safe, brak rekomendacji', () => {
    const r = assessHeatStress({
      crop: 'corn',
      bbch: 63,
      forecast: [
        { date: '2026-07-20', tMax: 25 },
        { date: '2026-07-21', tMax: 27 },
      ],
    });
    expect(r.worstLevel).toBe('safe');
    expect(r.shouldCreateRecommendation).toBe(false);
  });
});
