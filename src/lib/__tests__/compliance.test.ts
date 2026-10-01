import { describe, it, expect } from 'vitest';
import { evaluateCompliance } from '../compliance';

describe('evaluateCompliance', () => {
  it('gospodarstwo 20 ha z 1 uprawą 100% — fail dywersyfikacji', () => {
    const r = evaluateCompliance({
      totalHectares: 20,
      fields: [
        { id: '1', name: 'A', crop: 'wheat', areaHectares: 20, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
      ],
    });
    const div = r.rules.find((x) => x.id === 'diversification-small');
    expect(div).toBeDefined();
    expect(div!.status).toBe('fail');
  });

  it('gospodarstwo 20 ha 2 uprawy 50/50 — pass dywersyfikacji', () => {
    const r = evaluateCompliance({
      totalHectares: 20,
      fields: [
        { id: '1', name: 'A', crop: 'wheat', areaHectares: 10, treatmentsCountThisSeason: 2, lastTreatmentAt: new Date() },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 10, treatmentsCountThisSeason: 2, lastTreatmentAt: new Date() },
      ],
    });
    const div = r.rules.find((x) => x.id === 'diversification-small');
    expect(div!.status).toBe('pass');
  });

  it('gospodarstwo 50 ha 3 uprawy 70/20/10 — pass dużego', () => {
    const r = evaluateCompliance({
      totalHectares: 50,
      fields: [
        { id: '1', name: 'A', crop: 'wheat', areaHectares: 35, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 10, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
        { id: '3', name: 'C', crop: 'corn', areaHectares: 5, treatmentsCountThisSeason: 2, lastTreatmentAt: new Date() },
      ],
    });
    const div = r.rules.find((x) => x.id === 'diversification-large');
    expect(div!.status).toBe('pass');
  });

  it('50 ha z 2 uprawami 60/40 — fail (mniej niż 3 uprawy)', () => {
    const r = evaluateCompliance({
      totalHectares: 50,
      fields: [
        { id: '1', name: 'A', crop: 'wheat', areaHectares: 30, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 20, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
      ],
    });
    const div = r.rules.find((x) => x.id === 'diversification-large');
    expect(div!.status).toBe('fail');
  });

  it('pole z pszenicą 3 sezony z rzędu — fail rotacji', () => {
    const r = evaluateCompliance({
      totalHectares: 20,
      fields: [
        {
          id: '1',
          name: 'Duże pole',
          crop: 'wheat',
          areaHectares: 10,
          previousCrops: ['wheat', 'wheat', 'wheat'],
          treatmentsCountThisSeason: 3,
          lastTreatmentAt: new Date(),
        },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 10, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
      ],
    });
    const rotation = r.rules.find((x) => x.id === 'rotation-1');
    expect(rotation).toBeDefined();
    expect(rotation!.status).toBe('fail');
  });

  it('pole z pszenicą 2 sezony — warn rotacji', () => {
    const r = evaluateCompliance({
      totalHectares: 20,
      fields: [
        {
          id: '1',
          name: 'Pole',
          crop: 'wheat',
          areaHectares: 10,
          previousCrops: ['rye', 'wheat', 'wheat'],
          treatmentsCountThisSeason: 3,
          lastTreatmentAt: new Date(),
        },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 10 },
      ],
    });
    const rotation = r.rules.find((x) => x.id === 'rotation-warn-1');
    expect(rotation).toBeDefined();
    expect(rotation!.status).toBe('warn');
  });

  it('pole <5 ha — rotacja nie sprawdzana', () => {
    const r = evaluateCompliance({
      totalHectares: 10,
      fields: [
        {
          id: '1',
          name: 'Mały',
          crop: 'wheat',
          areaHectares: 3,
          previousCrops: ['wheat', 'wheat', 'wheat'],
          treatmentsCountThisSeason: 1,
          lastTreatmentAt: new Date(),
        },
        { id: '2', name: 'B', crop: 'rye', areaHectares: 7, treatmentsCountThisSeason: 2, lastTreatmentAt: new Date() },
      ],
    });
    const rotation = r.rules.find((x) => x.id.startsWith('rotation'));
    expect(rotation).toBeUndefined();
  });

  it('rejestracja zabiegów — fail gdy pole bez wpisów', () => {
    const r = evaluateCompliance({
      totalHectares: 20,
      fields: [
        { id: '1', name: 'A', crop: 'wheat', areaHectares: 10, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 10, treatmentsCountThisSeason: 0 },
      ],
    });
    const reg = r.rules.find((x) => x.id === 'registration-missing');
    expect(reg).toBeDefined();
    expect(reg!.status).toBe('info'); // brak wpisów ≠ naruszenie (pole mogło nie być opryskiwane)
  });

  it('liczy score 0-100', () => {
    const r = evaluateCompliance({
      totalHectares: 20,
      fields: [
        { id: '1', name: 'A', crop: 'wheat', areaHectares: 10, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
        { id: '2', name: 'B', crop: 'rapeseed', areaHectares: 10, treatmentsCountThisSeason: 3, lastTreatmentAt: new Date() },
      ],
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

// Regresja 10.2026 (weryfikacja przepisów): demo z pszenicą 76% dostawało „OK".
describe('GAEC 7 >30 ha — największa uprawa ≤75%', () => {
  const f = (id: string, crop: string, ha: number) => ({ id, name: id, crop, areaHectares: ha, treatmentsCountThisSeason: 1, lastTreatmentAt: new Date() });

  it('pszenica 76% na 62 ha (jak demo) → fail, z konkretną liczbą ha do przesunięcia', () => {
    const r = evaluateCompliance({ totalHectares: 62.24, fields: [f('a', 'wheat', 47.4), f('b', 'potato', 11.4), f('c', 'rapeseed', 3.44)] });
    const div = r.rules.find((x) => x.id === 'diversification-large')!;
    expect(div.status).toBe('fail');
    expect(div.action).toMatch(/przesuń co najmniej \d+(,\d)? ha/);
  });

  it('70/20/10 → pass', () => {
    const r = evaluateCompliance({ totalHectares: 100, fields: [f('a', 'wheat', 70), f('b', 'rapeseed', 20), f('c', 'corn', 10)] });
    expect(r.rules.find((x) => x.id === 'diversification-large')!.status).toBe('pass');
  });

  it('trzecia uprawa poniżej 5% (zmyślony próg) nie jest błędem, jeśli 75/95 spełnione', () => {
    const r = evaluateCompliance({ totalHectares: 100, fields: [f('a', 'wheat', 70), f('b', 'rapeseed', 22), f('c', 'corn', 4), f('d', 'oats', 4)] });
    expect(r.rules.find((x) => x.id === 'diversification-large')!.status).toBe('pass');
  });

  it('GAEC 8 nie twierdzi już, że 4% ugoru jest obowiązkowe', () => {
    const r = evaluateCompliance({ totalHectares: 50, fields: [f('a', 'wheat', 50)] });
    const g8 = r.rules.find((x) => x.id === 'gaec-8-info')!;
    expect(g8.detail).toMatch(/nie ma obowiązku/);
    expect(g8.title).not.toMatch(/minimum 4%/);
  });
});
