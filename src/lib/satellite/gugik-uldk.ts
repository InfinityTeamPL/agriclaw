// GUGiK ULDK — Usługa Lokalizacji Działek Katastralnych
// https://uldk.gugik.gov.pl — publiczna, darmowa, bez API key.
//
// Input: identyfikator działki TERYT (np. "301502_2.0001.123/4" albo tylko nr geodezyjny)
// Output: geometria poligonu WKT → konwertujemy na GeoJSON.
//
// Rolnik ma wszystkie numery działek w swoim wniosku JPO (ARiMR eWniosek+).

const ULDK_BASE = 'https://uldk.gugik.gov.pl/';

export interface ParcelResult {
  teryt: string;
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaHectares: number;
  centroid: { lat: number; lon: number };
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

  // Pobierz geometrię + powierzchnię (API ULDK zwraca plain text)
  const url = `${ULDK_BASE}?request=GetParcelById&id=${encodeURIComponent(cleanTeryt)}&result=geom_wkt,teryt`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'AgriClaw/1.0 (contact@infinityteam.io)' },
  });
  if (!res.ok) throw new Error(`ULDK HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split('\n');

  // Format odpowiedzi:
  //   0            <- status code (0 = success)
  //   <WKT>|<teryt>  <- dane oddzielone pionową kreską
  if (lines[0] !== '0') {
    return null;
  }

  const dataLine = lines[1];
  if (!dataLine) return null;

  const parts = dataLine.split(';'); // ULDK separator for multi-field
  const wktPart = parts[0].split('|')[0] || parts[0];

  // Parse WKT POLYGON / MULTIPOLYGON
  const polygon = parseWkt(wktPart);
  if (!polygon) return null;

  // Oblicz powierzchnię i centroid z współrzędnych (WGS84 UTM) — przybliżenie dla ha
  const { area, centroid } = computePolygonAreaCentroid(polygon);

  return {
    teryt: cleanTeryt,
    polygon,
    areaHectares: area / 10_000,
    centroid,
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
  // ULDK: GetParcelByXY (WGS84)
  const url = `${ULDK_BASE}?request=GetParcelByXY&xy=${lon},${lat},4326&result=geom_wkt,teryt`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'AgriClaw/1.0 (contact@infinityteam.io)' },
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
  };
}

// ────────────────────────────────────────────────────────────
// WKT → GeoJSON parser (minimalny dla POLYGON i MULTIPOLYGON)
// ────────────────────────────────────────────────────────────

function parseWkt(wkt: string): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  const trimmed = wkt.trim();
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

function parseMultiPolygon(wkt: string): GeoJSON.MultiPolygon | null {
  const match = wkt.match(/^MULTIPOLYGON\s*\(\((.+)\)\)$/s);
  if (!match) return null;
  // Simplified: bierzemy tylko pierwszy polygon dla większości działek
  const firstPoly = match[1].split(/\)\),\s*\(\(/)[0];
  const rings = firstPoly.split(/\),\s*\(/).map((r) => parseCoords(r));
  return { type: 'MultiPolygon', coordinates: [rings] };
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

function computePolygonAreaCentroid(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): { area: number; centroid: { lat: number; lon: number } } {
  const ring =
    geom.type === 'Polygon'
      ? (geom.coordinates[0] as Array<[number, number]>)
      : (geom.coordinates[0][0] as Array<[number, number]>);

  if (ring.length < 3) return { area: 0, centroid: { lat: 0, lon: 0 } };

  // Shoelace + konwersja do metrów przez spherical earth (R=6378137m)
  const R = 6_378_137;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    area +=
      ((lon2 - lon1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  const areaM2 = Math.abs((area * R * R) / 2);

  // Centroid — prosty średnia współrzędnych
  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of ring) {
    sumLon += lon;
    sumLat += lat;
  }
  const centroid = {
    lat: sumLat / ring.length,
    lon: sumLon / ring.length,
  };

  return { area: areaM2, centroid };
}
