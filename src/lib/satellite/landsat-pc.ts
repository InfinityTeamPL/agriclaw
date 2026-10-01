// Landsat 8/9 Collection 2 Level-2 (temperatura powierzchni) przez Microsoft
// Planetary Computer — darmowe, bez klucza API.
//
// Po co: darmowe konto CDSE NIE zawiera Landsat (Process API zwraca
// „Unable to resolve: LOTL2"), więc kafelek termiki zawsze kończył się 503.
// Planetary Computer udostępnia te same sceny jako Cloud-Optimized GeoTIFF;
// czytamy wyłącznie okno pola (HTTP range requests), nie całą scenę (~100 MB).
//
// Pipeline: STAC search → podpis SAS (darmowy token) → okno COG lwir11 + qa_pixel
// → maska chmur/cieni/śniegu z QA_PIXEL → LST °C dla pikseli wewnątrz poligonu.

import { fromUrl } from 'geotiff';
import { fetchWithTimeout } from './http';

const STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const SAS_TOKEN_URL = 'https://planetarycomputer.microsoft.com/api/sas/v1/token/landsat-c2-l2';

// Landsat C2 L2 ST_B10: DN * 0.00341802 + 149.0 = kelwiny; 0 = brak danych.
const ST_SCALE = 0.00341802;
const ST_OFFSET = 149.0;
// QA_PIXEL bity 0-5: fill, dilated cloud, cirrus, cloud, cloud shadow, snow.
const QA_REJECT_MASK = 0b111111;

type LngLat = [number, number];

export interface LandsatThermalResult {
  values: Float32Array; // °C, tylko piksele wewnątrz pola i bez chmur
  sceneId: string;
  acquiredAt: string; // ISO
  cloudCover: number; // % sceny (informacyjnie — maskujemy per piksel)
  platform: string;
}

// ── Projekcja WGS84 → UTM (formuły Krügera, dokładność sub-metrowa) ────────────
export function lonLatToUtm(lon: number, lat: number, zone: number, north = true): [number, number] {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const lon0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const lam = lon * (Math.PI / 180);

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = ep2 * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lam - lon0);
  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));

  const easting =
    k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) +
    500000;
  let northing =
    k0 *
    (M +
      N *
        Math.tan(phi) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
  if (!north) northing += 10000000;
  return [easting, northing];
}

/** Strefa UTM z kodu EPSG 326xx (N) / 327xx (S). */
export function utmZoneFromEpsg(epsg: number): { zone: number; north: boolean } | null {
  if (epsg >= 32601 && epsg <= 32660) return { zone: epsg - 32600, north: true };
  if (epsg >= 32701 && epsg <= 32760) return { zone: epsg - 32700, north: false };
  return null;
}

function pointInRing(x: number, y: number, ring: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Konwersja surowego DN ST_B10 na °C; null dla fill/chmury. */
export function dnToCelsius(dn: number, qa: number): number | null {
  if (dn === 0) return null;
  if ((qa & QA_REJECT_MASK) !== 0) return null;
  return dn * ST_SCALE + ST_OFFSET - 273.15;
}

// ── Token SAS (darmowy, ~1 h) — cache na poziomie modułu ───────────────────────
let sasToken: string | null = null;
let sasExpiresAt = 0;

async function getSasToken(): Promise<string> {
  if (sasToken && Date.now() < sasExpiresAt) return sasToken;
  const res = await fetchWithTimeout(SAS_TOKEN_URL, { timeoutMs: 10_000, retries: 1 });
  if (!res.ok) throw new Error(`Planetary Computer SAS: ${res.status}`);
  const data = (await res.json()) as { token: string; 'msft:expiry': string };
  sasToken = data.token;
  // 5 min marginesu przed wygaśnięciem.
  sasExpiresAt = new Date(data['msft:expiry']).getTime() - 5 * 60_000;
  return sasToken;
}

interface StacItem {
  id: string;
  properties: Record<string, unknown>;
  assets: Record<string, { href: string }>;
}

async function searchScenes(polygon: GeoJSON.Polygon, from: string, to: string): Promise<StacItem[]> {
  const res = await fetchWithTimeout(STAC_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collections: ['landsat-c2-l2'],
      intersects: polygon,
      datetime: `${from}T00:00:00Z/${to}T23:59:59Z`,
      // Chmury maskujemy per piksel; próg sceny tylko odcina scenę całkowicie zasłoniętą.
      query: { 'eo:cloud_cover': { lt: 70 }, platform: { in: ['landsat-8', 'landsat-9'] } },
      sortby: [{ field: 'datetime', direction: 'desc' }],
      limit: 6,
    }),
    timeoutMs: 20_000,
    retries: 1,
  });
  if (!res.ok) throw new Error(`Planetary Computer STAC: ${res.status}`);
  const data = (await res.json()) as { features?: StacItem[] };
  return data.features ?? [];
}

async function readFieldWindow(
  item: StacItem,
  polygon: GeoJSON.Polygon,
  token: string,
): Promise<Float32Array | null> {
  const epsg = Number(item.properties['proj:epsg']);
  const utm = utmZoneFromEpsg(epsg);
  const stHref = item.assets.lwir11?.href;
  const qaHref = item.assets.qa_pixel?.href;
  if (!utm || !stHref || !qaHref) return null;

  const ring = (polygon.coordinates[0] as LngLat[]).map(
    ([lon, lat]) => lonLatToUtm(lon, lat, utm.zone, utm.north) as LngLat,
  );
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const [minE, maxE, minN, maxN] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  const [stTiff, qaTiff] = await Promise.all([
    fromUrl(`${stHref}?${token}`),
    fromUrl(`${qaHref}?${token}`),
  ]);
  const stImg = await stTiff.getImage();
  const [originX, originY] = stImg.getOrigin();
  const [resX, resY] = stImg.getResolution(); // resY < 0
  const width = stImg.getWidth();
  const height = stImg.getHeight();

  // Okno pikseli obejmujące bbox pola (+1 px marginesu), przycięte do sceny.
  const x0 = Math.max(0, Math.floor((minE - originX) / resX) - 1);
  const x1 = Math.min(width, Math.ceil((maxE - originX) / resX) + 1);
  const y0 = Math.max(0, Math.floor((maxN - originY) / resY) - 1);
  const y1 = Math.min(height, Math.ceil((minN - originY) / resY) + 1);
  if (x1 <= x0 || y1 <= y0) return null; // pole poza sceną

  const window = [x0, y0, x1, y1];
  const qaImg = await qaTiff.getImage();
  const [stRaster, qaRaster] = await Promise.all([
    stImg.readRasters({ window, samples: [0], interleave: true }),
    qaImg.readRasters({ window, samples: [0], interleave: true }),
  ]);
  const st = stRaster as unknown as ArrayLike<number>;
  const qa = qaRaster as unknown as ArrayLike<number>;

  const w = x1 - x0;
  const out: number[] = [];
  for (let row = 0; row < y1 - y0; row++) {
    for (let col = 0; col < w; col++) {
      // Środek piksela w UTM — liczymy tylko piksele wewnątrz poligonu pola.
      const e = originX + (x0 + col + 0.5) * resX;
      const n = originY + (y0 + row + 0.5) * resY;
      if (!pointInRing(e, n, ring)) continue;
      const idx = row * w + col;
      const c = dnToCelsius(st[idx], qa[idx]);
      if (c !== null) out.push(c);
    }
  }
  return Float32Array.from(out);
}

/**
 * Najnowsza scena Landsat z wystarczającą liczbą bezchmurnych pikseli w polu.
 * Zwraca null, gdy w oknie dat nie ma użytecznej sceny.
 */
export async function fetchLandsatThermalPC(
  polygon: GeoJSON.Polygon,
  from: string,
  to: string,
  opts: { minValidPixels?: number; maxScenes?: number } = {},
): Promise<LandsatThermalResult | null> {
  const minValid = opts.minValidPixels ?? 4;
  const items = await searchScenes(polygon, from, to);
  if (items.length === 0) return null;
  const token = await getSasToken();

  for (const item of items.slice(0, opts.maxScenes ?? 4)) {
    const values = await readFieldWindow(item, polygon, token);
    if (values && values.length >= minValid) {
      return {
        values,
        sceneId: item.id,
        acquiredAt: String(item.properties.datetime ?? ''),
        cloudCover: Number(item.properties['eo:cloud_cover'] ?? 0),
        platform: String(item.properties.platform ?? 'landsat'),
      };
    }
  }
  return null;
}
