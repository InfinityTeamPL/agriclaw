import { describe, it, expect } from 'vitest';
import {
  computeSoilMoistureS1,
  describeSoilMoistureS1,
  MIN_HISTORY_FOR_REFERENCE,
} from '../satellite/soil-moisture-s1';

// Typowy zakres VV dla pola uprawnego: ok. -18 dB (sucho) do -8 dB (mokro).
const dryToWetHistory = [-18, -17.5, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8.5];

describe('computeSoilMoistureS1 — wilgotność względna z radaru, nie udawany pomiar', () => {
  it('odczyt przy suchym końcu historii → niski procent', () => {
    const m = computeSoilMoistureS1(-17.5, dryToWetHistory, 0.3)!;
    expect(m).not.toBeNull();
    expect(m.relativePct).toBeLessThan(20);
    expect(m.method).toBe('change-detection-vv');
  });

  it('odczyt przy mokrym końcu → wysoki procent', () => {
    const m = computeSoilMoistureS1(-8.6, dryToWetHistory, 0.3)!;
    expect(m.relativePct).toBeGreaterThan(80);
  });

  it('odczyt w środku zakresu → ~połowa', () => {
    const m = computeSoilMoistureS1(-13, dryToWetHistory, 0.3)!;
    expect(m.relativePct).toBeGreaterThan(35);
    expect(m.relativePct).toBeLessThan(65);
  });

  it('za mało historii → null (nie zgadujemy referencji)', () => {
    const short = dryToWetHistory.slice(0, MIN_HISTORY_FOR_REFERENCE - 1);
    expect(computeSoilMoistureS1(-13, short, 0.3)).toBeNull();
  });

  it('brak dynamiki backscatteru → null (wynik byłby szumem)', () => {
    const flat = new Array(12).fill(-12.0);
    expect(computeSoilMoistureS1(-12, flat, 0.3)).toBeNull();
  });

  it('gęsty łan (NDVI > 0,6) → pewność low + jawne zastrzeżenie', () => {
    const m = computeSoilMoistureS1(-13, dryToWetHistory, 0.75)!;
    expect(m.confidence).toBe('low');
    expect(m.caveats.join(' ')).toMatch(/łan/i);
  });

  it('krótka historia → pewność co najwyżej medium + zastrzeżenie', () => {
    const short = dryToWetHistory.slice(0, 9);
    const m = computeSoilMoistureS1(-13, short, 0.3)!;
    expect(m.confidence).toBe('medium');
    expect(m.caveats.join(' ')).toMatch(/historia/i);
  });

  it('długa historia + rzadki łan → pewność high, bez zastrzeżeń', () => {
    const long = [...dryToWetHistory, ...dryToWetHistory.map((v) => v + 0.3)];
    const m = computeSoilMoistureS1(-13, long, 0.25)!;
    expect(m.confidence).toBe('high');
    expect(m.caveats).toHaveLength(0);
  });

  it('odczyt poza zakresem → przycięty do 0..100 + zastrzeżenie', () => {
    const wetter = computeSoilMoistureS1(-5, dryToWetHistory, 0.3)!;
    expect(wetter.relativePct).toBe(100);
    expect(wetter.caveats.join(' ')).toMatch(/poza/i);

    const drier = computeSoilMoistureS1(-25, dryToWetHistory, 0.3)!;
    expect(drier.relativePct).toBe(0);
  });

  it('NaN/niepoprawne wejście → null zamiast fałszywej liczby', () => {
    expect(computeSoilMoistureS1(NaN, dryToWetHistory, 0.3)).toBeNull();
    expect(computeSoilMoistureS1(-13, [NaN, NaN], 0.3)).toBeNull();
  });

  it('nieznane NDVI nie wywala korekty wegetacji', () => {
    const m = computeSoilMoistureS1(-13, dryToWetHistory, null)!;
    expect(m).not.toBeNull();
    expect(m.relativePct).toBeGreaterThan(0);
  });

  it('opis jest zawsze względny — nigdy nie podaje m³/m³', () => {
    const m = computeSoilMoistureS1(-9, dryToWetHistory, 0.3)!;
    const text = describeSoilMoistureS1(m);
    expect(text).toMatch(/zakresu sucho–mokro/);
    expect(text).not.toMatch(/m³|m3/);
  });
});
