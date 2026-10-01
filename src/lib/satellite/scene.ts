// Wybór sceny Sentinel-2 dla analizy pola: NAJNOWSZA scena, na której pole jest
// faktycznie widoczne (po masce chmur SCL), zamiast mozaiki `leastCC` z 14 dni.
//
// Dlaczego: mozaika nie zwraca daty, więc zapisywaliśmy `observedAt = now()` —
// w UI „dane z 01.10, 20:47 · zachmurzenie 0%" (godzina kliknięcia, nie przelotu
// satelity), a cron co dzień dopisywał „nowy" odczyt tej samej sceny.

import type { CopernicusClient } from './copernicus';
import { extractMultiIndexValues } from './copernicus';
import { computeAllIndices } from './indices';

export type AllIndices = ReturnType<typeof computeAllIndices>;

export interface SceneResult {
  indices: AllIndices;
  /** Moment przelotu satelity (z katalogu STAC). */
  sceneAt: Date;
  /** Zachmurzenie POLA (nie całego kafla 110×110 km): ułamek 0–1 pikseli pola zamaskowanych przez SCL (konwencja NdviReading.cloudCover). */
  cloudCover: number;
}

/** Minimalny udział czystych pikseli, żeby uznać scenę za pomiar pola. */
export const MIN_VALID_SHARE = 0.5;

/**
 * Zwraca najnowszą scenę z ≥50% czystych pikseli pola albo null (same chmury).
 * Sprawdza najwyżej `maxTries` najnowszych scen, żeby nie mnożyć zapytań.
 */
export async function fetchLatestClearScene(
  client: CopernicusClient,
  polygon: GeoJSON.Polygon,
  dateFrom: string,
  dateTo: string,
  { maxTries = 3 }: { maxTries?: number } = {},
): Promise<SceneResult | null> {
  const scenes = dedupeByDay(await client.searchS2Scenes(polygon, dateFrom, dateTo));
  for (const scene of scenes.slice(0, maxTries)) {
    const day = scene.datetime.slice(0, 10);
    const tiff = await client.fetchMultiIndexGeotiff(polygon, day, day, { maxCloudCoverage: 100 });
    const rasters = await extractMultiIndexValues(tiff);
    const indices = computeAllIndices(rasters);
    // Raster pokrywa bbox; piksele poza poligonem też są NaN, więc mianownikiem
    // jest liczba pikseli SAMEGO pola (udział poligonu w bbox), nie cały raster.
    const fieldPixels = rasters.ndvi.length * polygonBboxFill(polygon);
    const clearShare = fieldPixels > 0 ? Math.min(1, indices.ndvi.validCount / fieldPixels) : 0;
    if (clearShare >= MIN_VALID_SHARE) {
      return {
        indices,
        sceneAt: new Date(scene.datetime),
        cloudCover: Math.round((1 - clearShare) * 100) / 100,
      };
    }
  }
  return null;
}

/** Ten sam dzień = ta sama orbita nad polem (kafle sąsiednie); bierzemy mniej zachmurzony. */
export function dedupeByDay<T extends { datetime: string; cloudCover: number }>(scenes: T[]): T[] {
  const byDay = new Map<string, T>();
  for (const s of scenes) {
    const day = s.datetime.slice(0, 10);
    const prev = byDay.get(day);
    if (!prev || s.cloudCover < prev.cloudCover) byDay.set(day, s);
  }
  return [...byDay.values()].sort((a, b) => b.datetime.localeCompare(a.datetime));
}

/** Jaką część prostokąta otaczającego zajmuje poligon (0–1). Wystarcza płaskie
 *  przybliżenie w stopniach — pole ma setki metrów, zniekształcenie pomijalne. */
export function polygonBboxFill(polygon: GeoJSON.Polygon): number {
  const ring = polygon.coordinates[0] ?? [];
  if (ring.length < 4) return 0;
  let area = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
    minX = Math.min(minX, x1); maxX = Math.max(maxX, x1);
    minY = Math.min(minY, y1); maxY = Math.max(maxY, y1);
  }
  const bbox = (maxX - minX) * (maxY - minY);
  return bbox > 0 ? Math.abs(area) / 2 / bbox : 0;
}

export { TREND_WINDOW_DAYS } from './trend-window';
