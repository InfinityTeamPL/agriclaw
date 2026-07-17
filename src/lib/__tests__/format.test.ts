// Testy formatterów UI. Te funkcje wyglądają błaho, ale to one decydują, czy
// rolnik widzi „4 pola" czy „4 pól" i „59,10 ha" czy „59.10 ha" — audyt wskazał
// błędną odmianę i kropkę dziesiętną jako sygnały „to jest prototyp".

import { describe, it, expect } from 'vitest';
import {
  pluralPL,
  formatHa,
  formatDatePL,
  formatDateTimePL,
  cropLabel,
  severityStyle,
} from '../ui/format';

describe('pluralPL — polska odmiana po liczebniku', () => {
  const pole = (n: number) => `${n} ${pluralPL(n, 'pole', 'pola', 'pól')}`;

  it('1 → forma pojedyncza', () => {
    expect(pole(1)).toBe('1 pole');
  });

  it('2–4 → forma „few" (to był błąd: „4 pól")', () => {
    expect(pole(2)).toBe('2 pola');
    expect(pole(3)).toBe('3 pola');
    expect(pole(4)).toBe('4 pola');
  });

  it('5–21 → forma „many"', () => {
    expect(pole(5)).toBe('5 pól');
    expect(pole(11)).toBe('11 pól');
    expect(pole(21)).toBe('21 pól');
  });

  it('12–14 to wyjątek — mimo końcówki 2–4 idzie „many"', () => {
    expect(pole(12)).toBe('12 pól');
    expect(pole(13)).toBe('13 pól');
    expect(pole(14)).toBe('14 pól');
  });

  it('22–24 wraca do formy „few" (końcówka decyduje poza 12–14)', () => {
    expect(pole(22)).toBe('22 pola');
    expect(pole(23)).toBe('23 pola');
    expect(pole(24)).toBe('24 pola');
  });

  it('112–114 to też wyjątek (mod 100)', () => {
    expect(pole(112)).toBe('112 pól');
    expect(pole(114)).toBe('114 pól');
    expect(pole(122)).toBe('122 pola');
  });

  it('0 → „many"', () => {
    expect(pole(0)).toBe('0 pól');
  });

  it('ostrzeżenia: 1 ostrzeżenie, nie „1 ostrzeżenia"', () => {
    const ostrz = (n: number) => `${n} ${pluralPL(n, 'ostrzeżenie', 'ostrzeżenia', 'ostrzeżeń')}`;
    expect(ostrz(1)).toBe('1 ostrzeżenie');
    expect(ostrz(2)).toBe('2 ostrzeżenia');
    expect(ostrz(5)).toBe('5 ostrzeżeń');
  });

  it('liczby ujemne i ułamkowe nie wywracają reguły', () => {
    expect(pluralPL(-4, 'pole', 'pola', 'pól')).toBe('pola');
    expect(pluralPL(2.7, 'pole', 'pola', 'pól')).toBe('pola'); // trunc → 2
  });
});

describe('formatHa — hektary po polsku (przecinek, nie kropka)', () => {
  it('używa przecinka dziesiętnego pl-PL', () => {
    expect(formatHa(59.1)).toBe('59,10');
    expect(formatHa(12.345)).toBe('12,35'); // zaokrąglenie do 2 miejsc
  });

  it('zawsze 2 miejsca po przecinku', () => {
    expect(formatHa(7)).toBe('7,00');
  });

  it('nie-liczba nie wypluwa NaN na ekran rolnika', () => {
    expect(formatHa(NaN)).toBe('0');
    expect(formatHa(Infinity)).toBe('0');
  });

  it('zero jest poprawne, nie puste', () => {
    expect(formatHa(0)).toBe('0,00');
  });
});

describe('formatDatePL / formatDateTimePL — stabilne między serwerem a klientem', () => {
  it('formatuje datę po polsku', () => {
    expect(formatDatePL('2026-07-08T10:00:00Z')).toBe('08.07.2026');
  });

  it('strefa przypięta do Europe/Warsaw — koło północy UTC nie przeskakuje dnia', () => {
    // 23:30 UTC = 01:30 następnego dnia w Warszawie (czas letni).
    expect(formatDatePL('2026-07-08T23:30:00Z')).toBe('09.07.2026');
  });

  it('brak daty / śmieci → myślnik, nie „Invalid Date"', () => {
    expect(formatDatePL(null)).toBe('—');
    expect(formatDatePL(undefined)).toBe('—');
    expect(formatDatePL('nie-data')).toBe('—');
    expect(formatDateTimePL(null)).toBe('—');
    expect(formatDateTimePL('nie-data')).toBe('—');
  });

  it('formatDateTimePL dokłada godzinę', () => {
    expect(formatDateTimePL('2026-07-08T10:00:00Z')).toMatch(/^08\.07\.2026.*12:00$/);
  });
});

describe('cropLabel', () => {
  it('mapuje slug na polską etykietę', () => {
    expect(cropLabel('wheat')).toBe('Pszenica');
    expect(cropLabel('rapeseed')).toBe('Rzepak');
  });

  it('nieznany slug zwraca sam slug zamiast pustki', () => {
    expect(cropLabel('quinoa')).toBe('quinoa');
  });
});

describe('severityStyle — pigułki na tokenach sygnałów, nie surowych kolorach', () => {
  it('każdy poziom ma etykietę PL', () => {
    expect(severityStyle('high').label).toBe('Pilne');
    expect(severityStyle('medium').label).toBe('Ważne');
    expect(severityStyle('low').label).toBe('Do uwagi');
    expect(severityStyle('none').label).toBe('OK');
  });

  it('nieznany poziom degraduje do OK zamiast wywalać UI', () => {
    expect(severityStyle('cokolwiek').label).toBe('OK');
  });

  it('używa wyłącznie tokenów semantycznych (zakaz gray-*/emerald-* z design systemu)', () => {
    for (const sev of ['high', 'medium', 'low', 'none', 'nieznany']) {
      const { pill } = severityStyle(sev);
      expect(pill).not.toMatch(/gray-|emerald-|slate-|bg-white/);
      expect(pill).toMatch(/destructive|signal-/);
    }
  });
});
