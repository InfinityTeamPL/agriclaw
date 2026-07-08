// Klastrowanie pól po odległości — używane przez mini-mapę gospodarstwa
// do kadrowania największego skupiska (pola z importu ULDK potrafią leżeć
// setki km od siedziby; dopasowanie do wszystkich dawało widok całej Polski).

export type LngLat = [number, number];

/** Przybliżona odległość w km (equirectangular — wystarcza do klastrowania). */
export function kmBetween(a: LngLat, b: LngLat): number {
  const dLat = (b[1] - a[1]) * 110.574;
  const dLon = (b[0] - a[0]) * 111.32 * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/** Centroid pierścienia zewnętrznego poligonu (średnia wierzchołków). */
export function centroidOf(polygon: GeoJSON.Polygon): LngLat | null {
  const ring = polygon?.coordinates?.[0] as LngLat[] | undefined;
  if (!ring || ring.length === 0) return null;
  let lon = 0;
  let lat = 0;
  for (const c of ring) {
    lon += c[0];
    lat += c[1];
  }
  return [lon / ring.length, lat / ring.length];
}

/** Grupuje indeksy w skupiska: punkty bliżej niż `thresholdKm` trafiają razem (union-find). */
export function clusterByDistance(centroids: LngLat[], thresholdKm: number): number[][] {
  const parent = centroids.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      if (kmBetween(centroids[i], centroids[j]) <= thresholdKm) {
        parent[find(i)] = find(j);
      }
    }
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < centroids.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }
  return [...groups.values()];
}

/**
 * Wybiera skupisko do kadru mini-mapy: najliczniejsze, a przy remisie —
 * najbliższe siedzibie gospodarstwa.
 */
export function pickMainCluster(
  clusters: number[][],
  centroids: (LngLat | null)[],
  farmCenter: LngLat,
): number[] {
  const distToFarm = (g: number[]) =>
    Math.min(...g.map((i) => (centroids[i] ? kmBetween(centroids[i]!, farmCenter) : Infinity)));
  return clusters.reduce((a, b) =>
    b.length > a.length || (b.length === a.length && distToFarm(b) < distToFarm(a)) ? b : a,
  );
}
