// Weryfikacja substancji czynnych z diagnozy — regresja 10.2026: model
// zaproponował mankozeb (wycofany w UE od 2021) obok zielonego znaczka rejestru.
import { describe, it, expect, vi } from 'vitest';

const products: Record<string, Array<{ permitTo: Date | null; saleTo: Date | null; useTo: Date | null }>> = {
  azoksystrobina: [
    { permitTo: new Date('2028-05-31'), saleTo: null, useTo: null },
    { permitTo: new Date('2025-01-31'), saleTo: new Date('2025-07-31'), useTo: new Date('2026-01-31') },
  ],
  tebukonazol: [{ permitTo: new Date('2025-01-31'), saleTo: new Date('2025-07-31'), useTo: new Date('2026-01-31') }],
};
vi.mock('../prisma', () => ({
  prisma: {
    sorProduct: {
      findMany: async ({ where }: { where: { substances: { contains: string } } }) =>
        products[where.substances.contains] ?? [],
    },
  },
}));

import { splitSubstances, checkSubstances } from '../sor-registry';

describe('splitSubstances', () => {
  it('rozdziela alternatywy modelu', () => {
    expect(splitSubstances('mankozeb lub azoksystrobina')).toEqual(['mankozeb', 'azoksystrobina']);
  });
  it('usuwa dawki i nawiasy', () => {
    expect(splitSubstances('protiokonazol 125 g/l + tebukonazol (np. Prosaro)')).toEqual(['protiokonazol', 'tebukonazol']);
  });
  it('ignoruje słowa-wypełniacze', () => {
    expect(splitSubstances('azoksystrobina, inne / odpowiedniki')).toEqual(['azoksystrobina']);
  });
  it('pusty tekst → pusta lista', () => {
    expect(splitSubstances('')).toEqual([]);
  });
});

describe('checkSubstances', () => {
  const today = new Date('2026-10-01');

  it('mankozeb (zniknął z wykazu) → brak dopuszczonych środków', async () => {
    const [r] = await checkSubstances('mankozeb', today);
    expect(r).toMatchObject({ substance: 'mankozeb', usableProducts: 0, status: 'brak_dopuszczonych' });
  });

  it('azoksystrobina → dopuszczona, liczy tylko środki, których stosowanie jest dziś dozwolone', async () => {
    const [r] = await checkSubstances('azoksystrobina', today);
    expect(r).toMatchObject({ usableProducts: 1, totalProducts: 2, status: 'dopuszczona' });
  });

  it('substancja obecna wyłącznie w wycofanych środkach → brak dopuszczonych', async () => {
    const [r] = await checkSubstances('tebukonazol', today);
    expect(r).toMatchObject({ usableProducts: 0, totalProducts: 1, status: 'brak_dopuszczonych' });
  });
});
