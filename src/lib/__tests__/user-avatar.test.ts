import { describe, it, expect } from 'vitest';
import { initialsOf, paletteIndex } from '@/components/brand/UserAvatar';

describe('initialsOf', () => {
  it('dwa pierwsze słowa imienia i nazwiska', () => {
    expect(initialsOf('Jan Kowalski', 'x@y.pl')).toBe('JK');
    expect(initialsOf('anna maria nowak', 'x@y.pl')).toBe('AM');
  });
  it('bez imienia — z adresu e-mail (przed i po @, kropkach)', () => {
    expect(initialsOf(null, 'jan.kowalski@gmail.com')).toBe('JK');
    expect(initialsOf('  ', 'rolnik@farma.pl')).toBe('RF');
  });
  it('polskie litery i pusty wynik', () => {
    expect(initialsOf('Łukasz Żak', 'x@y.pl')).toBe('ŁŻ');
    expect(initialsOf('', '@')).toBe('AG');
  });
});

describe('paletteIndex', () => {
  it('deterministyczny i w zakresie', () => {
    expect(paletteIndex('a@b.pl')).toBe(paletteIndex('a@b.pl'));
    for (const s of ['a', 'jan@x.pl', 'zażółć@gęślą.pl', '']) {
      const i = paletteIndex(s);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(6);
    }
  });
});
