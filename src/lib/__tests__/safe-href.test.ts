import { describe, it, expect } from 'vitest';
import { safeHref } from '@/lib/ui/safe-href';

describe('safeHref', () => {
  it('przepuszcza http, https i mailto', () => {
    expect(safeHref('https://dane.gov.pl/x')).toBe('https://dane.gov.pl/x');
    expect(safeHref('http://example.com')).toBe('http://example.com');
    expect(safeHref('mailto:contact@infinityteam.io')).toBe('mailto:contact@infinityteam.io');
  });

  it('blokuje javascript:, data: i inne schematy (także z dziwną wielkością liter i spacjami)', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('JaVaScRiPt:alert(1)')).toBeNull();
    expect(safeHref('  javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHref('vbscript:msgbox')).toBeNull();
  });

  it('odrzuca adresy bez schematu i puste', () => {
    expect(safeHref('//evil.com')).toBeNull();
    expect(safeHref('/dashboard')).toBeNull();
    expect(safeHref('')).toBeNull();
  });
});
