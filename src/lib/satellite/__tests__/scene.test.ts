import { describe, it, expect } from 'vitest';
import { dedupeByDay, polygonBboxFill } from '../scene';

describe('dedupeByDay', () => {
  it('jedna scena na dzień (mniej zachmurzony kafel), najnowsze pierwsze', () => {
    const out = dedupeByDay([
      { datetime: '2026-09-26T10:05:59Z', cloudCover: 31.9 },
      { datetime: '2026-09-28T09:56:03Z', cloudCover: 0.19 },
      { datetime: '2026-09-28T09:56:04Z', cloudCover: 0.18 },
      { datetime: '2026-09-26T10:05:58Z', cloudCover: 34.2 },
    ]);
    expect(out.map((s) => s.cloudCover)).toEqual([0.18, 31.9]);
  });
});

describe('polygonBboxFill', () => {
  it('prostokąt wypełnia bbox w 100%', () => {
    expect(polygonBboxFill({ type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]]] })).toBeCloseTo(1);
  });
  it('trójkąt (pole „po skosie") — 50%', () => {
    expect(polygonBboxFill({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 1], [0, 0]]] })).toBeCloseTo(0.5);
  });
  it('zdegenerowany poligon → 0, bez dzielenia przez zero', () => {
    expect(polygonBboxFill({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 0]]] })).toBe(0);
  });
});
