import { describe, it, expect } from 'vitest';
import { generateRecommendation } from '../recommendations';

describe('generateRecommendation', () => {
  it('zwraca HIGH dla silnej suszy + niski NDVI', () => {
    const rec = generateRecommendation({
      crop: 'wheat',
      ndviMean: 0.25,
      ndviPrevious: 0.55,
      daysWithoutRain: 7,
      avgEt0Next7: 4.5,
      soilMoisturePct: 15,
    });
    expect(rec.severity).toBe('high');
    expect(rec.message.toLowerCase()).toContain('pszenic');
  });

  it('zwraca MEDIUM dla spadku NDVI bez suszy → choroba', () => {
    const rec = generateRecommendation({
      crop: 'wheat',
      ndviMean: 0.5,
      ndviPrevious: 0.7,
      daysWithoutRain: 1,
      avgEt0Next7: 2.5,
    });
    expect(rec.severity).toBe('medium');
    expect(rec.action.toLowerCase()).toMatch(/fungicyd|choroba/);
  });

  it('zwraca NONE dla zdrowego pola', () => {
    const rec = generateRecommendation({
      crop: 'wheat',
      ndviMean: 0.75,
      ndviPrevious: 0.73,
      daysWithoutRain: 2,
      avgEt0Next7: 2,
    });
    expect(rec.severity).toBe('none');
  });

  it('zwraca MEDIUM przy umiarkowanej suszy', () => {
    const rec = generateRecommendation({
      crop: 'corn',
      ndviMean: 0.42,
      daysWithoutRain: 4,
      avgEt0Next7: 3.2,
    });
    expect(rec.severity).toBe('medium');
  });
});
