// Nominatim geocoding (OpenStreetMap) — darmowe, bez klucza
// Limit: 1 request/sek, User-Agent wymagany.
// Używamy do zamiany adresu gospodarstwa (np. "Włocławek, Kujawska 12") na lat/lon.

import { fetchWithTimeout } from './http';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  boundingBox?: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
}

export async function geocodeAddress(
  address: string,
  countryCode = 'pl',
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    addressdetails: '0',
    limit: '1',
    countrycodes: countryCode,
  });

  const res = await fetchWithTimeout(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': 'AgriClaw/0.1 (contact@infinityteam.io)',
      'Accept-Language': 'pl,en',
    },
    timeoutMs: 10_000,
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    boundingbox?: [string, string, string, string];
  }>;

  const first = data[0];
  if (!first) return null;

  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    displayName: first.display_name,
    boundingBox: first.boundingbox
      ? [
          parseFloat(first.boundingbox[0]),
          parseFloat(first.boundingbox[1]),
          parseFloat(first.boundingbox[2]),
          parseFloat(first.boundingbox[3]),
        ]
      : undefined,
  };
}
