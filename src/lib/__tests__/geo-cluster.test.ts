import { describe, it, expect } from 'vitest';
import { kmBetween, centroidOf, clusterByDistance, pickMainCluster, type LngLat } from '../geo/cluster';

// Odtworzenie realnych danych demo: 2 pola pod Włocławkiem, 2 pod Zamościem
// (import ULDK) — mini-mapa kadrowała całą Polskę i „nie było widać nic".
const WLOCLAWEK_1: LngLat = [18.879, 52.5616]; // Pole 1
const WLOCLAWEK_2: LngLat = [19.065, 52.645]; // Pole za stodołą
const ZAMOSC_1: LngLat = [23.2854, 50.6929]; // Pol4
const ZAMOSC_2: LngLat = [23.2325, 50.6501]; // Rzepak
const FARM_CENTER: LngLat = [19.07, 52.65]; // siedziba: Włocławek

describe('geo/cluster — kadr mini-mapy gospodarstwa', () => {
  it('kmBetween: Włocławek—Zamość to setki km, sąsiednie pola to kilkanaście', () => {
    expect(kmBetween(WLOCLAWEK_1, ZAMOSC_1)).toBeGreaterThan(250);
    expect(kmBetween(WLOCLAWEK_1, WLOCLAWEK_2)).toBeLessThan(25);
    expect(kmBetween(ZAMOSC_1, ZAMOSC_2)).toBeLessThan(25);
  });

  it('centroidOf liczy środek pierścienia, odporny na brak danych', () => {
    const poly: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [19.0, 52.0],
          [19.02, 52.0],
          [19.02, 52.02],
          [19.0, 52.02],
        ],
      ],
    };
    const c = centroidOf(poly)!;
    expect(c[0]).toBeCloseTo(19.01, 2);
    expect(c[1]).toBeCloseTo(52.01, 2);
    expect(centroidOf({ type: 'Polygon', coordinates: [] })).toBeNull();
  });

  it('clusterByDistance rozdziela dwa skupiska oddalone o 350 km', () => {
    const clusters = clusterByDistance([ZAMOSC_1, ZAMOSC_2, WLOCLAWEK_1, WLOCLAWEK_2], 25);
    expect(clusters).toHaveLength(2);
    expect(clusters.map((c) => c.length).sort()).toEqual([2, 2]);
  });

  it('pickMainCluster przy remisie 2:2 wybiera skupisko bliżej siedziby (Włocławek)', () => {
    const centroids = [ZAMOSC_1, ZAMOSC_2, WLOCLAWEK_1, WLOCLAWEK_2];
    const clusters = clusterByDistance(centroids, 25);
    const main = pickMainCluster(clusters, centroids, FARM_CENTER);
    // Indeksy 2 i 3 to pola włocławskie
    expect([...main].sort()).toEqual([2, 3]);
  });

  it('pickMainCluster preferuje liczniejsze skupisko nawet gdy dalsze od siedziby', () => {
    const centroids = [ZAMOSC_1, ZAMOSC_2, [23.29, 50.7] as LngLat, WLOCLAWEK_1];
    const clusters = clusterByDistance(centroids, 25);
    const main = pickMainCluster(clusters, centroids, FARM_CENTER);
    expect(main).toHaveLength(3); // 3 pola zamojskie wygrywają z 1 włocławskim
  });

  it('jedno skupisko → wszystkie pola w kadrze (nic ukrytego)', () => {
    const centroids = [WLOCLAWEK_1, WLOCLAWEK_2];
    const clusters = clusterByDistance(centroids, 25);
    expect(clusters).toHaveLength(1);
    const main = pickMainCluster(clusters, centroids, FARM_CENTER);
    expect(main).toHaveLength(2);
  });
});
