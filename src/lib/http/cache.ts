// Nagłówki cache dla odpowiedzi zależnych od sesji (dane jednego gospodarstwa).
//
// Kontekst: warstwy satelitarne (PNG 1024×1024) były pobierane z CDSE przy KAŻDYM
// wejściu na mapę pola. Kafel 1024² jest ~4× droższy od bazowego 512², a darmowy
// limit CDSE to 10 000 PU/mies. Scena Sentinel-2 zmienia się co ~5 dni, więc
// krótka świeżość nic nie gubi, a wycina powtarzane pobrania.

export interface PrivateCacheOptions {
  /** Jak długo odpowiedź jest świeża (sekundy). */
  maxAgeSeconds: number;
  /** Jak długo można podać nieświeżą, odświeżając w tle (sekundy). */
  staleWhileRevalidateSeconds?: number;
}

/**
 * Cache prywatny, kluczowany sesją.
 *
 * `private` — odpowiedź dotyczy jednego gospodarstwa, nigdy nie trafia do CDN.
 * `Vary: Cookie` — KRYTYCZNE: bez tego na współdzielonej przeglądarce drugi
 * użytkownik mógłby dostać z cache warstwę cudzego pola (klucz cache to sam URL).
 */
export function privateCacheHeaders({
  maxAgeSeconds,
  staleWhileRevalidateSeconds,
}: PrivateCacheOptions): Record<string, string> {
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) {
    throw new Error(`privateCacheHeaders: maxAgeSeconds musi być >= 0, dostano ${maxAgeSeconds}`);
  }
  const parts = ['private', `max-age=${Math.floor(maxAgeSeconds)}`];
  if (staleWhileRevalidateSeconds && staleWhileRevalidateSeconds > 0) {
    parts.push(`stale-while-revalidate=${Math.floor(staleWhileRevalidateSeconds)}`);
  }
  return {
    'Cache-Control': parts.join(', '),
    Vary: 'Cookie',
  };
}

/** 6 h świeżości + doba na odświeżanie w tle — dobrane do rewizyty Sentinel-2 (~5 dni). */
export const EO_LAYER_CACHE_HEADERS = privateCacheHeaders({
  maxAgeSeconds: 6 * 3600,
  staleWhileRevalidateSeconds: 24 * 3600,
});
