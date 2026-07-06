import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  excelDateToUtc,
  computeStatus,
  normalizeName,
  cropMatches,
  isCropCodeSupported,
  pickLatestRelease,
  parseRelease,
} from '../sor-registry';

function xlsxBuffer(rows: Record<string, unknown>[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Arkusz1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return buf;
}

describe('excelDateToUtc', () => {
  it('konwertuje serial Excela na datę (45976 ≈ 2025-11)', () => {
    const d = excelDateToUtc(45976);
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2025);
  });
  it('null/0/ujemne/NaN → null; Date przechodzi bez zmian', () => {
    expect(excelDateToUtc(null)).toBeNull();
    expect(excelDateToUtc(0)).toBeNull();
    expect(excelDateToUtc(-5)).toBeNull();
    const d = new Date('2026-01-01');
    expect(excelDateToUtc(d)).toBe(d);
  });
});

describe('computeStatus — status prawny środka', () => {
  const day = (s: string) => new Date(s);
  it('aktualny gdy zezwolenie trwa', () => {
    expect(
      computeStatus(
        { permitTo: day('2027-01-01'), saleTo: day('2027-06-01'), useTo: day('2028-01-01') },
        day('2026-07-06'),
      ),
    ).toBe('aktualny');
  });
  it('wyprzedaż: zezwolenie wygasło, sprzedaż jeszcze dozwolona', () => {
    expect(
      computeStatus(
        { permitTo: day('2026-01-01'), saleTo: day('2026-12-01'), useTo: day('2027-06-01') },
        day('2026-07-06'),
      ),
    ).toBe('wyprzedaz');
  });
  it('do_zuzycia: sprzedaż zakończona, stosowanie jeszcze dozwolone', () => {
    expect(
      computeStatus(
        { permitTo: day('2025-06-01'), saleTo: day('2026-01-01'), useTo: day('2027-01-01') },
        day('2026-07-06'),
      ),
    ).toBe('do_zuzycia');
  });
  it('wycofany: po TerminDopuszczenia stosowanie NIEDOZWOLONE (rozstrzygające)', () => {
    expect(
      computeStatus(
        { permitTo: day('2025-01-01'), saleTo: day('2025-06-01'), useTo: day('2026-01-01') },
        day('2026-07-06'),
      ),
    ).toBe('wycofany');
  });
  it('braki dat traktowane zachowawczo jako aktualny', () => {
    expect(computeStatus({ permitTo: null, saleTo: null, useTo: null }, day('2026-07-06'))).toBe(
      'aktualny',
    );
  });

  it('DZIEŃ GRANICZNY WŁĄCZNIE: w dniu useTo środek NIE jest jeszcze wycofany', () => {
    // Terminy MRiRW ("do dnia X") są włączne — o 10:00 dnia X stosowanie legalne.
    const p = { permitTo: day('2025-01-01'), saleTo: day('2025-06-01'), useTo: day('2026-07-06') };
    expect(computeStatus(p, new Date('2026-07-06T10:00:00Z'))).toBe('do_zuzycia');
    expect(computeStatus(p, new Date('2026-07-06T23:59:59Z'))).toBe('do_zuzycia');
    expect(computeStatus(p, new Date('2026-07-07T00:00:01Z'))).toBe('wycofany');
  });
});

describe('normalizeName + cropMatches', () => {
  it('normalizacja: wielkość liter, polskie znaki, spacje', () => {
    expect(normalizeName('  Pszenica   OZIMA ')).toBe('pszenica ozima');
    expect(normalizeName('Jęczmień jary')).toBe('jeczmien jary');
  });
  it('dopasowuje formy rejestru do kodów AgriClaw', () => {
    expect(cropMatches('pszenica ozima', 'wheat')).toBe(true);
    expect(cropMatches('Pszenica jara', 'wheat')).toBe(true);
    expect(cropMatches('ziemniak', 'potato')).toBe(true);
    expect(cropMatches('burak cukrowy', 'sugarbeet')).toBe(true);
    expect(cropMatches('rzepak ozimy', 'rapeseed')).toBe(true);
    expect(cropMatches('trawniki', 'wheat')).toBe(false);
    expect(cropMatches('kukurydza', 'unknown-code')).toBe(false);
  });

  it('NIE autoryzuje prawnie odrębnych upraw (przegląd adwersaryjny)', () => {
    // "pszenżyto" ≠ "żyto" — 419 produktów pszenżyta łapało się na kod rye
    expect(cropMatches('pszenżyto ozime', 'rye')).toBe(false);
    expect(cropMatches('żyto ozime', 'rye')).toBe(true);
    // "burak ćwikłowy/pastewny" ≠ "burak cukrowy"
    expect(cropMatches('burak ćwikłowy', 'sugarbeet')).toBe(false);
    expect(cropMatches('burak pastewny', 'sugarbeet')).toBe(false);
    // "kukurydza cukrowa" (warzywo) ≠ kukurydza polowa
    expect(cropMatches('kukurydza cukrowa', 'corn')).toBe(false);
    expect(cropMatches('kukurydza', 'corn')).toBe(true);
    // odmiany pszenicy prawnie odrębne
    expect(cropMatches('pszenica orkisz', 'wheat')).toBe(false);
    expect(cropMatches('pszenica twarda', 'wheat')).toBe(false);
  });

  it('komórka-lista upraw: dopasowanie per token', () => {
    expect(cropMatches('pszenica ozima, pszenżyto ozime', 'wheat')).toBe(true);
    expect(cropMatches('pszenica ozima, pszenżyto ozime', 'rye')).toBe(false);
    expect(cropMatches('jęczmień jary; owies', 'oats')).toBe(true);
  });

  it('isCropCodeSupported: "other" i nieznane kody → false (walidacja niemożliwa, nie "brak rejestracji")', () => {
    expect(isCropCodeSupported('wheat')).toBe(true);
    expect(isCropCodeSupported('other')).toBe(false);
    expect(isCropCodeSupported('')).toBe(false);
  });
});

describe('pickLatestRelease — wybór najnowszego kompletnego wydania', () => {
  it('wybiera najnowszą datę z KOMPLETEM (podstawowy + zastosowania)', () => {
    const r = pickLatestRelease([
      { id: 10, title: 'rejestr podstawowy - 26.06.2026 r.' },
      { id: 11, title: 'rejestr zastosowań - 26.06.2026 r.' },
      { id: 8, title: 'rejestr podstawowy - 29.05.2026 r.' },
      { id: 9, title: 'rejestr zastosowań - 29.05.2026 r.' },
      { id: 12, title: 'słownik uprawy - 26.06.2026 r.' },
    ]);
    expect(r).toEqual({ label: '26.06.2026', basicId: '10', applicationsId: '11' });
  });
  it('pomija niekompletne najnowsze wydanie (fallback do starszego)', () => {
    const r = pickLatestRelease([
      { id: 20, title: 'rejestr podstawowy - 31.07.2026 r.' }, // brak zastosowań!
      { id: 10, title: 'rejestr podstawowy - 26.06.2026 r.' },
      { id: 11, title: 'rejestr zastosowań - 26.06.2026 r.' },
    ]);
    expect(r?.label).toBe('26.06.2026');
  });
  it('poprawnie sortuje daty między latami (dd.mm.yyyy)', () => {
    const r = pickLatestRelease([
      { id: 1, title: 'rejestr podstawowy - 30.12.2025 r.' },
      { id: 2, title: 'rejestr zastosowań - 30.12.2025 r.' },
      { id: 3, title: 'rejestr podstawowy - 02.01.2026 r.' },
      { id: 4, title: 'rejestr zastosowań - 02.01.2026 r.' },
    ]);
    expect(r?.label).toBe('02.01.2026');
  });
  it('brak kompletu → null', () => {
    expect(pickLatestRelease([{ id: 1, title: 'słownik agrofagów - 26.06.2026 r.' }])).toBeNull();
  });

  it('korekta wydania z tą samą datą: wygrywa PIERWSZY (najnowszy) zasób z listy -created', () => {
    const r = pickLatestRelease([
      { id: 30, title: 'rejestr podstawowy - 26.06.2026 r.' }, // korekta (nowsza)
      { id: 31, title: 'rejestr zastosowań - 26.06.2026 r.' },
      { id: 10, title: 'rejestr podstawowy - 26.06.2026 r.' }, // pierwotne wgranie
      { id: 11, title: 'rejestr zastosowań - 26.06.2026 r.' },
    ]);
    expect(r).toEqual({ label: '26.06.2026', basicId: '30', applicationsId: '31' });
  });
});

describe('parseRelease — parsowanie skoroszytów wydania', () => {
  it('parsuje produkty i zastosowania, odrzuca sieroty bez produktu', () => {
    const basic = xlsxBuffer([
      {
        id_sor: '{AAA}', nazwa: 'Testowy 250 EC', producent_prosty: 'Firma',
        NrZezw: 'R-1/2026', Rodzaj: 'Fungicyd', Zawartosc_SBCZ_prosty: 'tebukonazol - 250 g',
        TerminZezw: 46522, TerminDopSprzedazy: 46522, TerminDopuszczenia: 46522,
        etykieta: 'https://www.gov.pl/rolnictwo/s-t1',
      },
    ]);
    const apps = xlsxBuffer([
      { id_sor: '{AAA}', uprawa: 'pszenica ozima', agrofag: 'septorioza', dawka: 'Zalecana dawka: 1 l/ha', termin: 'BBCH 30-59', maloobszarowe: null, metody_stosowania: 'opryskiwanie' },
      { id_sor: '{ZZZ}', uprawa: 'rzepak', agrofag: 'phoma', dawka: '0.5 l/ha' }, // sierota
      { id_sor: '{AAA}', uprawa: '', agrofag: 'bez uprawy' }, // brak uprawy → odrzucone
    ]);
    const parsed = parseRelease(basic, apps);
    expect(parsed.products).toHaveLength(1);
    expect(parsed.products[0]).toMatchObject({
      id: '{AAA}', name: 'Testowy 250 EC', kind: 'Fungicyd',
      labelPage: 'https://www.gov.pl/rolnictwo/s-t1',
    });
    expect(parsed.products[0].useTo).toBeInstanceOf(Date);
    expect(parsed.applications).toHaveLength(1);
    expect(parsed.applications[0]).toMatchObject({
      sorId: '{AAA}', crop: 'pszenica ozima', minorUse: false,
    });
  });

  it('maloobszarowe: wartość niepusta ≠ 0 → true', () => {
    const basic = xlsxBuffer([{ id_sor: '{A}', nazwa: 'X' }]);
    const apps = xlsxBuffer([
      { id_sor: '{A}', uprawa: 'malina', maloobszarowe: 1 },
      { id_sor: '{A}', uprawa: 'pszenica', maloobszarowe: 0 },
    ]);
    const parsed = parseRelease(basic, apps);
    expect(parsed.applications.find((a) => a.crop === 'malina')?.minorUse).toBe(true);
    expect(parsed.applications.find((a) => a.crop === 'pszenica')?.minorUse).toBe(false);
  });
});
