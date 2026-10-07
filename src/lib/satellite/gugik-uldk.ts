// GUGiK ULDK — Usługa Lokalizacji Działek Katastralnych
// https://uldk.gugik.gov.pl — publiczna, darmowa, bez API key.
//
// Input: identyfikator działki TERYT (np. "301502_2.0001.123/4" albo tylko nr geodezyjny)
// Output: geometria poligonu WKT → konwertujemy na GeoJSON.
//
// Rolnik ma wszystkie numery działek w swoim wniosku JPO (ARiMR eWniosek+).

import { fetchWithTimeout } from './http';

const ULDK_BASE = 'https://uldk.gugik.gov.pl/';

export interface ParcelResult {
  teryt: string;
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaHectares: number;
  centroid: { lat: number; lon: number };
  /** Z ilu osobnych części składa się działka (np. przecięta drogą). 1 dla zwykłej. */
  parts: number;
}

/**
 * Pobiera działkę po identyfikatorze TERYT.
 * Format TERYT: SSXXXX_Y.ZZZZ.NNNNN/NN
 *   SS = kod województwa (np. 30 = wielkopolskie, 14 = mazowieckie)
 *   XXXX = powiat + gmina
 *   Y = typ obrębu (0/1/2/3)
 *   ZZZZ = numer obrębu
 *   NNNNN/NN = numer działki (opcjonalny człon /NN to część)
 */
export async function fetchParcelByTeryt(teryt: string): Promise<ParcelResult | null> {
  const cleanTeryt = teryt.trim();
  if (!cleanTeryt) return null;

  // Pobierz geometrię + powierzchnię (API ULDK zwraca plain text).
  // srid=4326 → współrzędne w WGS84 (stopnie), inaczej ULDK zwraca EPSG:2180 (metry),
  // których nasz parser/area/centroid nie obsługuje. Patrz audyt 2.7.
  const url = `${ULDK_BASE}?request=GetParcelById&id=${encodeURIComponent(cleanTeryt)}&result=geom_wkt,teryt&srid=4326`;

  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'AgriClaw/1.0 (contact@infinityteam.io)' },
    timeoutMs: 12_000,
    retries: 1,
  });
  if (!res.ok) throw new Error(`ULDK HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split('\n');

  // Format odpowiedzi:
  //   0                             <- status code (0 = success)
  //   SRID=4326;<WKT>|<teryt>       <- pola oddzielone pionową kreską; geom ma
  //                                    prefiks SRID=<n>; który trzeba zdjąć.
  if (lines[0] !== '0') {
    return null;
  }

  const dataLine = lines[1];
  if (!dataLine) return null;

  // Pola rozdzielone '|' (NIE ';' — średnik jest częścią prefiksu SRID w WKT).
  const wktPart = dataLine.split('|')[0];

  // Parse WKT POLYGON / MULTIPOLYGON (parseWkt zdejmuje prefiks SRID=<n>;)
  const polygon = parseWkt(wktPart);
  if (!polygon) return null;

  // Oblicz powierzchnię i centroid z współrzędnych (WGS84 UTM) — przybliżenie dla ha
  const { area, centroid } = computePolygonAreaCentroid(polygon);

  return {
    teryt: cleanTeryt,
    polygon,
    areaHectares: area / 10_000,
    centroid,
    parts: polygon.type === 'MultiPolygon' ? polygon.coordinates.length : 1,
  };
}

/**
 * Wyszukuje działki po współrzędnych (lat/lon) — "znajdź numer mojej działki"
 * kiedy rolnik klika na mapie.
 */
export async function fetchParcelByCoords(
  lat: number,
  lon: number,
): Promise<ParcelResult | null> {
  // ULDK: GetParcelByXY. xy w WGS84 (4326) + srid=4326 dla geometrii wyjściowej.
  const url = `${ULDK_BASE}?request=GetParcelByXY&xy=${lon},${lat},4326&result=geom_wkt,teryt&srid=4326`;

  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'AgriClaw/1.0 (contact@infinityteam.io)' },
    timeoutMs: 12_000,
    retries: 1,
  });
  if (!res.ok) return null;

  const text = await res.text();
  const lines = text.trim().split('\n');
  if (lines[0] !== '0') return null;

  const dataLine = lines[1];
  if (!dataLine) return null;

  const parts = dataLine.split('|');
  const wkt = parts[0];
  const teryt = parts[1] ?? 'unknown';

  const polygon = parseWkt(wkt);
  if (!polygon) return null;

  const { area, centroid } = computePolygonAreaCentroid(polygon);
  return {
    teryt,
    polygon,
    areaHectares: area / 10_000,
    centroid,
    parts: polygon.type === 'MultiPolygon' ? polygon.coordinates.length : 1,
  };
}

// ────────────────────────────────────────────────────────────
// WKT → GeoJSON parser (minimalny dla POLYGON i MULTIPOLYGON)
// ────────────────────────────────────────────────────────────

export function parseWkt(wkt: string): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  // ULDK zwraca EWKT z prefiksem układu, np. "SRID=4326;POLYGON((...))" — zdejmujemy go.
  const trimmed = wkt.trim().replace(/^SRID=\d+;/i, '').trim();
  if (trimmed.startsWith('POLYGON')) {
    return parsePolygon(trimmed);
  }
  if (trimmed.startsWith('MULTIPOLYGON')) {
    return parseMultiPolygon(trimmed);
  }
  return null;
}

function parsePolygon(wkt: string): GeoJSON.Polygon | null {
  const match = wkt.match(/^POLYGON\s*\(\((.+)\)\)$/s);
  if (!match) return null;
  const ringsStr = match[1];
  // Multiple rings split by "), ("
  const rings = ringsStr.split(/\),\s*\(/).map((r) => parseCoords(r));
  if (rings.length === 0 || rings[0].length < 3) return null;
  return { type: 'Polygon', coordinates: rings };
}

// Zwraca zawartość każdej zbalansowanej grupy nawiasów na najwyższym poziomie:
// "(a),(b)" → ["a", "b"]. Działa dla zagnieżdżeń, w których zwykły split po "),(" się gubi.
function topLevelGroups(str: string): string[] {
  const groups: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && start >= 0) groups.push(str.slice(start, i));
    }
  }
  return groups;
}

function parseMultiPolygon(wkt: string): GeoJSON.MultiPolygon | null {
  const body = wkt.replace(/^MULTIPOLYGONs*/i, '');
  // body = "(((x y,...)),((x y,...)))" → grupa zewnętrzna zawiera poligony.
  const [inner] = topLevelGroups(body);
  if (!inner) return null;
  const polygons: Array<Array<Array<[number, number]>>> = [];
  for (const polyBody of topLevelGroups(inner)) {
    // polyBody = "(x y,...),(x y,...)" → pierścienie (zewnętrzny + dziury)
    const rings = topLevelGroups(polyBody).map((r) => parseCoords(r));
    if (rings.length > 0 && rings[0].length >= 4) polygons.push(rings);
  }
  if (polygons.length === 0) return null;
  return { type: 'MultiPolygon', coordinates: polygons };
}

function parseCoords(coordStr: string): Array<[number, number]> {
  return coordStr
    .split(',')
    .map((pair) => {
      const [x, y] = pair.trim().split(/\s+/).map(Number);
      return [x, y] as [number, number];
    })
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
}

// ────────────────────────────────────────────────────────────
// Area + centroid (przybliżone dla małych polygonów WGS84)
// ────────────────────────────────────────────────────────────

// Pole jednego pierścienia w m² (shoelace na sferze, R=6378137 m).
function ringAreaM2(ring: Array<[number, number]>): number {
  if (ring.length < 3) return 0;
  const R = 6_378_137;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    area +=
      ((lon2 - lon1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((area * R * R) / 2);
}

/** Powierzchnia poligonu w m²: pierścień zewnętrzny minus dziury. */
export function polygonAreaM2(poly: GeoJSON.Polygon): number {
  const [outer, ...holes] = poly.coordinates as Array<Array<[number, number]>>;
  return Math.max(0, ringAreaM2(outer) - holes.reduce((sum, h) => sum + ringAreaM2(h), 0));
}

/** Rozbija geometrię na poligony. */
export function polygonParts(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon): GeoJSON.Polygon[] {
  return geom.type === 'Polygon'
    ? [geom]
    : geom.coordinates.map((coordinates) => ({ type: 'Polygon' as const, coordinates }));
}

/** Największa część działki (do zapisania jako pole, gdy działka ma kilka części). */
export function largestPart(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon): GeoJSON.Polygon {
  return polygonParts(geom).reduce((best, p) => (polygonAreaM2(p) > polygonAreaM2(best) ? p : best));
}

function computePolygonAreaCentroid(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): { area: number; centroid: { lat: number; lon: number } } {
  const parts = polygonParts(geom);
  const area = parts.reduce((sum, p) => sum + polygonAreaM2(p), 0);

  // Centroid liczymy z największej części (prosta średnia wierzchołków zewnętrznego pierścienia).
  const ring = largestPart(geom).coordinates[0] as Array<[number, number]>;
  if (ring.length < 3) return { area: 0, centroid: { lat: 0, lon: 0 } };
  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of ring) {
    sumLon += lon;
    sumLat += lat;
  }
  return { area, centroid: { lat: sumLat / ring.length, lon: sumLon / ring.length } };
}
