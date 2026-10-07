import { describe, it, expect } from 'vitest';
import { guessCropFromProduct } from '@/lib/compliance-data';
import { evaluateCompliance } from '@/lib/compliance';

describe('guessCropFromProduct', () => {
  it('rozpoznaje podstawowe uprawy z nazwy produktu siewnego', () => {
    expect(guessCropFromProduct('Pszenica ozima Skagen')).toBe('wheat');
    expect(guessCropFromProduct('Rzepak ozimy')).toBe('rapeseed');
    expect(guessCropFromProduct('Kukurydza kiszonkowa')).toBe('corn');
    expect(guessCropFromProduct('Jęczmień jary')).toBe('barley');
    expect(guessCropFromProduct('Żyto hybrydowe')).toBe('rye');
    expect(guessCropFromProduct('Owies Chwat')).toBe('oats');
    expect(guessCropFromProduct('Ziemniak Irga')).toBe('potato');
    expect(guessCropFromProduct('Burak cukrowy')).toBe('sugarbeet');
  });

  it('pszenżyto nie jest pszenicą', () => {
    expect(guessCropFromProduct('Pszenżyto ozime')).toBe('other');
  });

  it('słowo z „owi" w środku nie jest owsem', () => {
    expect(guessCropFromProduct('Mieszanka bobowate')).toBe('other');
    expect(guessCropFromProduct('Nasiona dowolne')).toBe('other');
  });
});

describe('zgodność bez pól', () => {
  it('nie pokazuje 100% — brak danych to score null', () => {
    const r = evaluateCompliance({ totalHectares: 0, fields: [] });
    expect(r.score).toBeNull();
    expect(r.rules).toEqual([]);
  });

  it('nazwa uprawy w regule rotacji jest po polsku, nie slugiem', () => {
    const r = evaluateCompliance({
      totalHectares: 12,
      fields: [
        {
          id: '1',
          name: 'A',
          crop: 'wheat',
          areaHectares: 12,
          previousCrops: ['wheat', 'wheat', 'wheat'],
          treatmentsCountThisSeason: 1,
          lastTreatmentAt: new Date(),
        },
      ],
    });
    const rot = r.rules.find((x) => x.id.startsWith('rotation-'));
    expect(rot).toBeDefined();
    expect(rot!.detail).toContain('Pszenica');
    expect(rot!.detail).not.toContain('wheat');
  });
});
