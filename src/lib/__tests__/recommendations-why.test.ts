// Warstwa „dlaczego" (XAI) — badania adopcji wskazują nieprzejrzystość AI jako
// barierę zaufania. Rolnik ma zobaczyć, JAKA wartość i JAKI próg uruchomiły
// zalecenie, i móc się z tym nie zgodzić (np. wie, że lokalnie padało).
// Te testy pilnują, żeby wyjaśnienie było kompletne i zgodne z decyzją.

import { describe, it, expect } from 'vitest';
import { generateRecommendation, type RecommendationInput } from '../recommendations';

const base: RecommendationInput = {
  crop: 'wheat',
  ndviMean: 0.7,
  daysWithoutRain: 0,
  avgEt0Next7: 2,
};

describe('warstwa „dlaczego" — każda rekomendacja tłumaczy się z przesłanek', () => {
  it('KAŻDA ścieżka zwraca ruleId i niepustą listę przesłanek', () => {
    const cases: RecommendationInput[] = [
      { ...base, ndviMean: 0.25, ndviPrevious: 0.55, daysWithoutRain: 7, avgEt0Next7: 4.5, soilMoisturePct: 15 }, // susza
      { ...base, ndviMean: 0.4, ndviPrevious: 0.6, daysWithoutRain: 1, monthOfYear: 7 }, // senescencja
      { ...base, ndviMean: 0.4, ndviPrevious: 0.6, daysWithoutRain: 1, monthOfYear: 5 }, // choroba
      { ...base, ndviMean: 0.45, daysWithoutRain: 3 }, // stres wodny
      { ...base, ndviMean: 0.5 }, // średnia kondycja
      { ...base, ndviMean: 0.75 }, // zdrowe
    ];
    for (const input of cases) {
      const rec = generateRecommendation(input);
      expect(rec.ruleId, JSON.stringify(input)).toBeTruthy();
      expect(rec.why.length, `${rec.ruleId} bez przesłanek`).toBeGreaterThan(0);
      for (const e of rec.why) {
        expect(e.label).toBeTruthy();
        expect(e.value).toBeTruthy();
        expect(e.source, `${rec.ruleId}/${e.label} bez źródła`).toBeTruthy();
      }
    }
  });

  it('reguły mają rozróżnialne identyfikatory (nie da się pomylić przy sporze)', () => {
    const ids = [
      generateRecommendation({ ...base, ndviMean: 0.25, daysWithoutRain: 7, avgEt0Next7: 4.5, soilMoisturePct: 15 }).ruleId,
      generateRecommendation({ ...base, ndviMean: 0.4, ndviPrevious: 0.6, daysWithoutRain: 1, monthOfYear: 7 }).ruleId,
      generateRecommendation({ ...base, ndviMean: 0.4, ndviPrevious: 0.6, daysWithoutRain: 1, monthOfYear: 5 }).ruleId,
      generateRecommendation({ ...base, ndviMean: 0.45, daysWithoutRain: 3 }).ruleId,
      generateRecommendation({ ...base, ndviMean: 0.5 }).ruleId,
      generateRecommendation({ ...base, ndviMean: 0.75 }).ruleId,
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('susza: pokazuje NDVI, dni bez deszczu i parowanie z progami', () => {
    const rec = generateRecommendation({
      ...base,
      ndviMean: 0.25,
      daysWithoutRain: 7,
      avgEt0Next7: 4.5,
      soilMoisturePct: 15,
    });
    expect(rec.ruleId).toBe('drought-severe');
    const labels = rec.why.map((e) => e.label);
    expect(labels).toContain('NDVI');
    expect(labels).toContain('Dni bez deszczu');
    expect(labels).toContain('Parowanie (ET0)');
    expect(labels).toContain('Wilgotność gleby');
    // Wartości są realne, nie zaokrąglone do zera
    expect(rec.why.find((e) => e.label === 'NDVI')!.value).toBe('0,25');
    expect(rec.why.find((e) => e.label === 'Dni bez deszczu')!.value).toBe('7');
  });

  it('susza bez danych o wilgotności: NIE wymyśla przesłanki o glebie', () => {
    const rec = generateRecommendation({
      ...base,
      ndviMean: 0.25,
      daysWithoutRain: 7,
      avgEt0Next7: 4.5,
      // soilMoisturePct nieznane (SMAP wyłączony)
    });
    expect(rec.ruleId).toBe('drought-severe');
    expect(rec.why.map((e) => e.label)).not.toContain('Wilgotność gleby');
  });

  it('senescencja: tłumaczy się miesiącem, nie chorobą', () => {
    const rec = generateRecommendation({
      ...base,
      ndviMean: 0.4,
      ndviPrevious: 0.6,
      daysWithoutRain: 1,
      monthOfYear: 7,
    });
    expect(rec.ruleId).toBe('senescence');
    const miesiac = rec.why.find((e) => e.label === 'Miesiąc');
    expect(miesiac?.value).toBe('lipiec');
    expect(miesiac?.threshold).toMatch(/dojrzewani/i);
  });

  it('podejrzenie choroby: przesłanki jawnie wykluczają suszę i dojrzewanie', () => {
    const rec = generateRecommendation({
      ...base,
      ndviMean: 0.4,
      ndviPrevious: 0.6,
      daysWithoutRain: 1,
      monthOfYear: 5,
    });
    expect(rec.ruleId).toBe('disease-suspected');
    const text = rec.why.map((e) => `${e.label} ${e.threshold}`).join(' ');
    expect(text).toMatch(/susza.*wykluczona/i);
    expect(text).toMatch(/żółknięciem|dojrzewan/i);
  });

  it('zdrowe pole też się tłumaczy (nie tylko alarmy mają „dlaczego")', () => {
    const rec = generateRecommendation({ ...base, ndviMean: 0.75, ndviPrevious: 0.74 });
    expect(rec.ruleId).toBe('healthy');
    expect(rec.severity).toBe('none');
    const zmiana = rec.why.find((e) => e.label === 'Zmiana NDVI');
    expect(zmiana?.value).toMatch(/wzrost/);
  });

  it('liczby w przesłankach są po polsku (przecinek), spójnie z resztą UI', () => {
    const rec = generateRecommendation({ ...base, ndviMean: 0.45, daysWithoutRain: 3 });
    const ndvi = rec.why.find((e) => e.label === 'NDVI')!;
    expect(ndvi.value).toBe('0,45');
    expect(ndvi.value).not.toContain('.');
  });

  it('każda przesłanka mówi skąd pochodzi (satelita vs prognoza)', () => {
    const rec = generateRecommendation({
      ...base,
      ndviMean: 0.25,
      daysWithoutRain: 7,
      avgEt0Next7: 4.5,
    });
    expect(rec.why.find((e) => e.label === 'NDVI')!.source).toMatch(/Sentinel-2/);
    expect(rec.why.find((e) => e.label === 'Dni bez deszczu')!.source).toMatch(/Prognoza/);
  });
});
