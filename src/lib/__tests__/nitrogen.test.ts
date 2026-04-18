import { describe, it, expect } from 'vitest';
import { calculateNitrogen } from '../nitrogen';

describe('calculateNitrogen', () => {
  it('rekomenduje N1 40-50 kg/ha dla pszenicy przy optymalnym NDRE', () => {
    const r = calculateNitrogen({
      crop: 'wheat',
      bbch: 30,
      areaHectares: 10,
      ndre: 0.35, // optimum dla N1 = 0.35
    });
    expect(r).not.toBeNull();
    expect(r!.window).toBe('N1-start');
    expect(r!.doseKgNPerHa).toBeGreaterThanOrEqual(45);
    expect(r!.doseKgNPerHa).toBeLessThanOrEqual(55);
  });

  it('zmniejsza dawkę gdy NDRE wysokie (roślina ma azot)', () => {
    const r = calculateNitrogen({
      crop: 'wheat',
      bbch: 32, // N2 okno
      areaHectares: 10,
      ndre: 0.5, // DUŻO wyższe niż optimum 0.42 → redukcja
    });
    expect(r).not.toBeNull();
    expect(r!.window).toBe('N2-flag-leaf');
    expect(r!.adjustmentPct).toBeLessThan(0); // redukcja
    expect(r!.doseKgNPerHa).toBeLessThan(r!.baselineKgNPerHa);
    expect(r!.savingVsBaseline).not.toBeNull();
    expect(r!.savingVsBaseline!.kgN).toBeGreaterThan(0);
    expect(r!.savingVsBaseline!.pln).toBeGreaterThan(0);
  });

  it('zwiększa dawkę gdy NDRE bardzo niskie (niedobór)', () => {
    const r = calculateNitrogen({
      crop: 'wheat',
      bbch: 32,
      areaHectares: 10,
      ndre: 0.2, // DUŻO poniżej optimum 0.42 → zwiększenie
    });
    expect(r).not.toBeNull();
    expect(r!.adjustmentPct).toBeGreaterThan(0);
    expect(r!.doseKgNPerHa).toBeGreaterThan(r!.baselineKgNPerHa);
  });

  it('zwraca out-of-window poza fazą N', () => {
    const r = calculateNitrogen({
      crop: 'wheat',
      bbch: 75, // dojrzałość — poza
      areaHectares: 5,
      ndre: 0.3,
    });
    expect(r).not.toBeNull();
    expect(r!.window).toBe('out-of-window');
    expect(r!.doseKgNPerHa).toBe(0);
  });

  it('rapeseed w BBCH 50 — okno N1 wiosenny 90 kg N/ha', () => {
    const r = calculateNitrogen({
      crop: 'rapeseed',
      bbch: 50,
      areaHectares: 8,
      ndre: 0.30, // optimum
    });
    expect(r).not.toBeNull();
    expect(r!.window).toBe('N1-start');
    expect(r!.baselineKgNPerHa).toBe(90);
    // dawka ~90 przy optymalnym NDRE
    expect(r!.doseKgNPerHa).toBeGreaterThanOrEqual(85);
    expect(r!.doseKgNPerHa).toBeLessThanOrEqual(100);
  });

  it('liczy równoważnik w saletrze i moczniku', () => {
    const r = calculateNitrogen({
      crop: 'wheat',
      bbch: 30,
      areaHectares: 10,
      ndre: 0.35,
    });
    expect(r!.saletra34Kg).toBe(Math.round(r!.doseKgNPerHa / 0.34));
    expect(r!.mocznik46Kg).toBe(Math.round(r!.doseKgNPerHa / 0.46));
  });

  it('total kg N = dose × area', () => {
    const r = calculateNitrogen({
      crop: 'rapeseed',
      bbch: 50,
      areaHectares: 20,
      ndre: 0.30,
    });
    expect(r!.totalKgN).toBe(Math.round(r!.doseKgNPerHa * 20));
  });

  it('zwraca null dla crop=other (brak profilu)', () => {
    const r = calculateNitrogen({
      crop: 'other',
      bbch: 30,
      areaHectares: 5,
      ndre: 0.3,
    });
    expect(r).toBeNull();
  });

  it('bez NDRE stosuje dawkę książkową bez korekty', () => {
    const r = calculateNitrogen({
      crop: 'wheat',
      bbch: 30,
      areaHectares: 10,
      ndre: null,
    });
    expect(r!.adjustmentPct).toBe(0);
    expect(r!.doseKgNPerHa).toBe(r!.baselineKgNPerHa);
    expect(r!.reasoning).toMatch(/brak|książkow/i);
  });
});
