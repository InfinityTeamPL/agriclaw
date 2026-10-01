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

  it('NIE diagnozuje choroby przy spadku NDVI w oknie dojrzewania (lipiec, pszenica)', () => {
    const rec = generateRecommendation({
      crop: 'wheat',
      ndviMean: 0.5,
      ndviPrevious: 0.7,
      daysWithoutRain: 1,
      avgEt0Next7: 2.5,
      monthOfYear: 7, // dojrzewanie — spadek NDVI to senescencja, nie choroba
    });
    expect(rec.severity).toBe('low');
    expect(rec.title.toLowerCase()).toContain('dojrzewanie');
    expect(rec.action.toLowerCase()).not.toContain('fungicyd triazolowy');
  });

  it('diagnozuje możliwą chorobę przy spadku NDVI poza dojrzewaniem (maj, pszenica)', () => {
    const rec = generateRecommendation({
      crop: 'wheat',
      ndviMean: 0.5,
      ndviPrevious: 0.7,
      daysWithoutRain: 1,
      avgEt0Next7: 2.5,
      monthOfYear: 5, // pełnia wegetacji — podejrzenie choroby zasadne
    });
    expect(rec.severity).toBe('medium');
    // Nie zaleca konkretnego środka „w ciemno"
    expect(rec.action.toLowerCase()).toContain('potwierdzeniu');
  });
});

describe('faza uprawy (regresja 10.2026)', () => {
  const base = { crop: 'wheat', ndviMean: 0.42, daysWithoutRain: 4, avgEt0Next7: 1.2, monthOfYear: 10 };

  it('wschody: brak „wymaga uwagi" i brak mocznika', () => {
    const r = generateRecommendation({ ...base, stage: 'establishment' });
    expect(r.severity).toBe('none');
    expect(r.ruleId).toBe('establishment');
    expect(r.action).not.toMatch(/mocznik/i);
  });

  it('wschody + 14 dni suszy → niska waga, nie „stres wodny"; przesłanka z progiem pierwsza', () => {
    const r = generateRecommendation({ ...base, daysWithoutRain: 14, stage: 'establishment' });
    expect(r.ruleId).toBe('establishment-dry');
    expect(r.severity).toBe('low');
    expect(r.why[0].label).toBe('Dni bez deszczu');
  });

  it('wschody + tydzień bez deszczu → nie „do uwagi" (jesienią to norma)', () => {
    expect(generateRecommendation({ ...base, daysWithoutRain: 7, stage: 'establishment' }).severity).toBe('none');
  });

  it('spoczynek zimowy → bez zabiegów', () => {
    expect(generateRecommendation({ ...base, stage: 'dormancy' }).ruleId).toBe('dormancy');
  });

  it('bez fazy — zachowanie historyczne', () => {
    expect(generateRecommendation(base).ruleId).toBe('water-stress-moderate');
  });

  it('komunikaty z przecinkiem dziesiętnym', () => {
    expect(generateRecommendation({ ...base, daysWithoutRain: 0 }).message).toMatch(/0,42/);
  });
});
