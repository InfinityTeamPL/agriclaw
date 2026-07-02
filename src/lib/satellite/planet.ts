// Planet Labs API client — PSScene 3m rozdzielczość dzienna.
// 30k darmowych kredytów. Quick-search + thumbnail to NIE kosztuje kredytów
// (tylko order pełnych GeoTIFF kosztuje). Dla MVP używamy thumbnailów jako
// 3m RGB overlay na mapie — znacznie ostrzejsze niż Sentinel-2 10m.
//
// Docs: https://developers.planet.com/docs/apis/data/

import { fetchWithTimeout } from './http';

const PLANET_API = 'https://api.planet.com';

export interface PlanetItem {
  id: string;
  itemType: string;
  acquired: string; // ISO
  cloudCover: number; // 0-1
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  thumbnailUrl: string; // wymaga auth
}

/**
 * Quick-search PSScene items przecinających daną geometrię w danym oknie dat.
 * Zwraca najnowsze najpierw.
 */
export async function searchPlanetItems(
  apiKey: string,
  polygon: GeoJSON.Polygon,
  dateFrom: string, // YYYY-MM-DD
  dateTo: string,
  maxCloudCover = 0.3,
  limit = 10,
): Promise<PlanetItem[]> {
  const body = {
    item_types: ['PSScene'],
    filter: {
      type: 'AndFilter',
      config: [
        { type: 'GeometryFilter', field_name: 'geometry', config: polygon },
        {
          type: 'DateRangeFilter',
          field_name: 'acquired',
          config: { gte: `${dateFrom}T00:00:00Z`, lte: `${dateTo}T23:59:59Z` },
        },
        {
          type: 'RangeFilter',
          field_name: 'cloud_cover',
          config: { lte: maxCloudCover },
        },
      ],
    },
  };

  const url = `${PLANET_API}/data/v1/quick-search?_sort=acquired+desc&_page_size=${limit}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `api-key ${apiKey}`,
    },
    body: JSON.stringify(body),
    timeoutMs: 20_000,
    retries: 1,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Planet quick-search failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    features?: Array<{
      id: string;
      properties: { acquired: string; cloud_cover: number; item_type: string };
      geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
      _links?: { thumbnail?: string };
    }>;
  };

  const items = data.features ?? [];
  return items.map((f) => ({
    id: f.id,
    itemType: f.properties.item_type,
    acquired: f.properties.acquired,
    cloudCover: f.properties.cloud_cover,
    geometry: f.geometry,
    thumbnailUrl: f._links?.thumbnail ?? `${PLANET_API}/data/v1/item-types/${f.properties.item_type}/items/${f.id}/thumb`,
  }));
}

/**
 * Pobiera thumbnail (PNG) jako dataURL. Thumbnaile są darmowe.
 * Używamy size=large (512x512) dla czytelności.
 */
export async function fetchPlanetThumbnail(
  apiKey: string,
  item: PlanetItem,
): Promise<{ dataUrl: string; bytes: number }> {
  const url = `${item.thumbnailUrl}?width=512`;
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `api-key ${apiKey}` },
    timeoutMs: 20_000,
    retries: 1,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Planet thumbnail failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') ?? 'image/png';
  return {
    dataUrl: `data:${contentType};base64,${buffer.toString('base64')}`,
    bytes: buffer.length,
  };
}

/**
 * Oblicza bounding box polygonu — potrzebne do pozycjonowania image overlay na mapie.
 */
export function polygonBbox(polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon): {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
} {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  const rings =
    polygon.type === 'Polygon'
      ? polygon.coordinates
      : polygon.coordinates.flatMap((poly) => poly);
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { minLon, minLat, maxLon, maxLat };
}

export function isPlanetConfigured(): boolean {
  return Boolean(process.env.PLANET_API_KEY);
}
