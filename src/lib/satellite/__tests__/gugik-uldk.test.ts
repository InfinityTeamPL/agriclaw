import { describe, it, expect } from 'vitest';
import { parseWkt } from '../gugik-uldk';

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
});
