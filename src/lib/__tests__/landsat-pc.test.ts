// Termika Landsat przez Planetary Computer. Kluczowe niezmienniki: projekcja
// WGS84→UTM musi trafiać w piksel pola (błąd = temperatura sąsiedniego pola),
// a maska QA musi odrzucać chmury — wierzchołki chmur mają ~−2°C i bez maski
// rolnik dostałby fałszywy alarm przymrozkowy (zaobserwowane nad Zamościem 09.2026).
import { describe, it, expect } from 'vitest';
import { lonLatToUtm, utmZoneFromEpsg, dnToCelsius } from '../satellite/landsat-pc';

describe('lonLatToUtm', () => {
  it('południk osiowy strefy daje easting dokładnie 500 000 m', () => {
    const [e] = lonLatToUtm(21, 52, 34, true); // strefa 34: 18–24°E, osiowy 21°E
    expect(e).toBeCloseTo(500000, 3);
  });

  it('northing dla 52°N na południku osiowym ≈ łuk południka × 0,9996', () => {
    const [, n] = lonLatToUtm(21, 52, 34, true);
    expect(Math.abs(n - 5761038)).toBeLessThan(50);
  });

  it('symetria względem południka osiowego', () => {
    const [eW] = lonLatToUtm(20, 52, 34, true);
    const [eE] = lonLatToUtm(22, 52, 34, true);
    expect(eW + eE).toBeCloseTo(1000000, 3);
  });

  it('odległość 0,01° długości na 52°N ≈ 686 m (spójność skali)', () => {
    const [e1] = lonLatToUtm(23.37, 50.88, 34, true);
    const [e2] = lonLatToUtm(23.38, 50.88, 34, true);
    expect(e2 - e1).toBeGreaterThan(690);
    expect(e2 - e1).toBeLessThan(715);
  });
});

describe('utmZoneFromEpsg', () => {
  it('rozpoznaje strefy północne i południowe', () => {
    expect(utmZoneFromEpsg(32634)).toEqual({ zone: 34, north: true });
    expect(utmZoneFromEpsg(32733)).toEqual({ zone: 33, north: false });
  });
  it('odrzuca inne układy', () => {
    expect(utmZoneFromEpsg(4326)).toBeNull();
    expect(utmZoneFromEpsg(2180)).toBeNull(); // PUWG 1992
  });
});

describe('dnToCelsius — skala C2 L2 + maska chmur', () => {
  const CLEAR = 1 << 6; // bit 6 = clear

  it('przelicza DN na °C wg skali 0,00341802 + 149 K', () => {
    // 43000 DN → 43000*0,00341802 + 149 − 273,15 = 22,82°C
    expect(dnToCelsius(43000, CLEAR)!).toBeCloseTo(22.82, 1);
  });

  it('DN = 0 (fill) → brak wartości', () => {
    expect(dnToCelsius(0, CLEAR)).toBeNull();
  });

  it('chmura / cień / cirrus / śnieg / dilated cloud → brak wartości', () => {
    for (const bit of [1, 2, 3, 4, 5]) {
      expect(dnToCelsius(43000, CLEAR | (1 << bit)), `bit ${bit}`).toBeNull();
    }
  });

  it('realny piksel chmury znad Zamościa (QA 22280, ~−2°C) jest odrzucany', () => {
    expect(dnToCelsius(35664, 22280)).toBeNull();
  });
});
