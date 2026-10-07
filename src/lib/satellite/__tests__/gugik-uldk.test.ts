import { describe, it, expect } from 'vitest';
import { parseWkt, largestPart, polygonAreaM2, polygonParts } from '../gugik-uldk';

describe('parseWkt (ULDK)', () => {
  it('parsuje POLYGON z prefiksem SRID=4326 (format zwracany przez ULDK)', () => {
    const wkt = 'SRID=4326;POLYGON((21.0 52.2, 21.1 52.2, 21.1 52.3, 21.0 52.3, 21.0 52.2))';
    const geom = parseWkt(wkt);
    expect(geom).not.toBeNull();
    expect(geom!.type).toBe('Polygon');
    const ring = (geom as GeoJSON.Polygon).coordinates[0];
    expect(ring.length).toBe(5);
    expect(ring[0]).toEqual([21.0, 52.2]);
  });

  it('parsuje POLYGON bez prefiksu SRID', () => {
    const wkt = 'POLYGON((21.0 52.2, 21.1 52.2, 21.1 52.3, 21.0 52.2))';
    const geom = parseWkt(wkt);
    expect(geom).not.toBeNull();
    expect(geom!.type).toBe('Polygon');
  });

  it('parsuje MULTIPOLYGON z prefiksem SRID', () => {
    const wkt =
      'SRID=4326;MULTIPOLYGON(((21.0 52.2, 21.1 52.2, 21.1 52.3, 21.0 52.2)))';
    const geom = parseWkt(wkt);
    expect(geom).not.toBeNull();
    expect(geom!.type).toBe('MultiPolygon');
  });

  it('zwraca null dla nieznanego typu geometrii', () => {
    expect(parseWkt('SRID=4326;POINT(21.0 52.2)')).toBeNull();
  });

  it('MULTIPOLYGON z kilkoma częściami zachowuje WSZYSTKIE części i pierwszy punkt każdego pierścienia', () => {
    const wkt =
      'SRID=4326;MULTIPOLYGON(((21.0 52.2, 21.1 52.2, 21.1 52.3, 21.0 52.2)),((22.0 52.2, 22.2 52.2, 22.2 52.4, 22.0 52.2)))';
    const geom = parseWkt(wkt) as GeoJSON.MultiPolygon;
    expect(geom.type).toBe('MultiPolygon');
    expect(geom.coordinates).toHaveLength(2);
    expect(geom.coordinates[0][0][0]).toEqual([21.0, 52.2]);
    expect(geom.coordinates[0][0]).toHaveLength(4);
    expect(geom.coordinates[1][0][0]).toEqual([22.0, 52.2]);
    expect(geom.coordinates[1][0]).toHaveLength(4);
  });

  it('MULTIPOLYGON z dziurą w jednej części', () => {
    const wkt =
      'MULTIPOLYGON(((21 52, 21.2 52, 21.2 52.2, 21 52.2, 21 52),(21.05 52.05, 21.1 52.05, 21.1 52.1, 21.05 52.05)))';
    const geom = parseWkt(wkt) as GeoJSON.MultiPolygon;
    expect(geom.coordinates).toHaveLength(1);
    expect(geom.coordinates[0]).toHaveLength(2); // zewnętrzny + dziura
  });

  it('największa część i powierzchnia (dziura odejmowana)', () => {
    const wkt =
      'MULTIPOLYGON(((21.0 52.2, 21.1 52.2, 21.1 52.3, 21.0 52.2)),((22.0 52.2, 22.2 52.2, 22.2 52.4, 22.0 52.2)))';
    const geom = parseWkt(wkt)!;
    expect(polygonParts(geom)).toHaveLength(2);
    const big = largestPart(geom);
    expect(big.coordinates[0][0]).toEqual([22.0, 52.2]);
    expect(polygonAreaM2(big)).toBeGreaterThan(polygonAreaM2(polygonParts(geom)[0]));
  });
});
