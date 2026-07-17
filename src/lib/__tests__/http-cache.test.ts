// Cache warstw satelitarnych obcina zużycie darmowego limitu CDSE (10 000 PU/mies.),
// ale nagłówek musi być DOKŁADNIE poprawny: pomyłka w `private`/`Vary` oznaczałaby
// wyciek warstwy cudzego pola z cache przeglądarki albo CDN-u.

import { describe, it, expect } from 'vitest';
import { privateCacheHeaders, EO_LAYER_CACHE_HEADERS } from '../http/cache';

describe('privateCacheHeaders — cache prywatny, kluczowany sesją', () => {
  it('składa Cache-Control z max-age', () => {
    const h = privateCacheHeaders({ maxAgeSeconds: 300 });
    expect(h['Cache-Control']).toBe('private, max-age=300');
  });

  it('dokłada stale-while-revalidate gdy podane', () => {
    const h = privateCacheHeaders({ maxAgeSeconds: 300, staleWhileRevalidateSeconds: 600 });
    expect(h['Cache-Control']).toBe('private, max-age=300, stale-while-revalidate=600');
  });

  it('pomija stale-while-revalidate gdy 0/undefined', () => {
    expect(privateCacheHeaders({ maxAgeSeconds: 60, staleWhileRevalidateSeconds: 0 })['Cache-Control'])
      .toBe('private, max-age=60');
    expect(privateCacheHeaders({ maxAgeSeconds: 60 })['Cache-Control']).toBe('private, max-age=60');
  });

  it('ZAWSZE ustawia Vary: Cookie — bez tego drugi user na tej samej przeglądarce dostałby cudze pole', () => {
    expect(privateCacheHeaders({ maxAgeSeconds: 1 }).Vary).toBe('Cookie');
    expect(EO_LAYER_CACHE_HEADERS.Vary).toBe('Cookie');
  });

  it('NIGDY nie jest public — dane jednego gospodarstwa nie mogą trafić do CDN', () => {
    const h = privateCacheHeaders({ maxAgeSeconds: 3600, staleWhileRevalidateSeconds: 7200 });
    expect(h['Cache-Control']).toMatch(/^private,/);
    expect(h['Cache-Control']).not.toMatch(/public|s-maxage/);
    expect(EO_LAYER_CACHE_HEADERS['Cache-Control']).not.toMatch(/public|s-maxage/);
  });

  it('ucina ułamki sekund (nagłówek musi być liczbą całkowitą)', () => {
    expect(privateCacheHeaders({ maxAgeSeconds: 10.9, staleWhileRevalidateSeconds: 20.9 })['Cache-Control'])
      .toBe('private, max-age=10, stale-while-revalidate=20');
  });

  it('max-age=0 jest dozwolone (wymuszona rewalidacja)', () => {
    expect(privateCacheHeaders({ maxAgeSeconds: 0 })['Cache-Control']).toBe('private, max-age=0');
  });

  it('odrzuca bezsensowne wartości zamiast produkować zepsuty nagłówek', () => {
    expect(() => privateCacheHeaders({ maxAgeSeconds: -1 })).toThrow();
    expect(() => privateCacheHeaders({ maxAgeSeconds: NaN })).toThrow();
  });
});

describe('EO_LAYER_CACHE_HEADERS — dobrane do rewizyty Sentinel-2', () => {
  it('6 h świeżości + doba SWR', () => {
    expect(EO_LAYER_CACHE_HEADERS['Cache-Control']).toBe(
      'private, max-age=21600, stale-while-revalidate=86400',
    );
  });

  it('świeżość jest krótsza niż rewizyta S2 (~5 dni) — nie pokazujemy starych danych', () => {
    const maxAge = Number(/max-age=(\d+)/.exec(EO_LAYER_CACHE_HEADERS['Cache-Control'])![1]);
    expect(maxAge).toBeLessThan(5 * 24 * 3600);
    // ...ale dość długa, by realnie ciąć zapytania w ciągu dnia pracy.
    expect(maxAge).toBeGreaterThanOrEqual(3600);
  });
});
