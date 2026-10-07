// Jedno źródło danych dla raportu zgodności WPR/IJHARS. Wcześniej panel główny,
// strona /dashboard/compliance i API /api/compliance/overview ładowały dane osobno
// (panel bez historii upraw i bez daty ostatniego zabiegu), więc ten sam rolnik
// widział 100% na pulpicie, a na stronie zgodności „naruszenie rotacji".

import { prisma } from '@/lib/prisma';
import { evaluateCompliance, type ComplianceReport } from '@/lib/compliance';

/**
 * Zgadnięcie uprawy z nazwy produktu w wpisie „siew" (np. „Pszenica ozima Skagen").
 * To heurystyka — w formularzu księgi nie ma osobnego pola uprawy.
 */
export function guessCropFromProduct(productName: string): string {
  const lower = productName.toLowerCase();
  // Pszenżyto to osobna uprawa — sprawdzamy przed „pszen", inaczej liczyłoby się jako pszenica.
  if (/pszenż|pszenz/.test(lower)) return 'other';
  if (/pszen/.test(lower)) return 'wheat';
  if (/rzepak/.test(lower)) return 'rapeseed';
  if (/kukurydz/.test(lower)) return 'corn';
  if (/jęczm|jeczm/.test(lower)) return 'barley';
  if (/żyt|zyt/.test(lower)) return 'rye';
  // „owies", „owsa" — ale nie dowolne słowo z „owi" w środku (np. „bobowate").
  if (/(^|[^a-ząćęłńóśźż])ow(ie)?s/.test(lower)) return 'oats';
  if (/ziemniak/.test(lower)) return 'potato';
  if (/burak/.test(lower)) return 'sugarbeet';
  return 'other';
}

export interface ComplianceData {
  report: ComplianceReport;
  fields: Array<{ id: string; name: string; crop: string; areaHectares: number }>;
  totalHectares: number;
}

export async function loadComplianceReport(farmId: string): Promise<ComplianceData> {
  const seasonStart = new Date(new Date().getFullYear(), 0, 1);

  const fields = await prisma.field.findMany({
    where: { farmId, deletedAt: null },
    select: {
      id: true,
      name: true,
      crop: true,
      areaHectares: true,
      treatments: {
        where: { performedAt: { gte: seasonStart } },
        select: { performedAt: true },
        orderBy: { performedAt: 'desc' },
      },
    },
  });

  // Historia upraw z wpisów „siew" z ostatnich 4 lat. Bez nich rotacja nie jest sprawdzana.
  const sowings = await prisma.treatment.findMany({
    where: {
      field: { farmId, deletedAt: null },
      type: 'sowing',
      performedAt: { gte: new Date(new Date().getFullYear() - 4, 0, 1) },
    },
    select: { fieldId: true, productName: true },
    orderBy: { performedAt: 'asc' },
  });
  const previousByField = new Map<string, string[]>();
  for (const s of sowings) {
    const arr = previousByField.get(s.fieldId) ?? [];
    arr.push(guessCropFromProduct(s.productName));
    previousByField.set(s.fieldId, arr);
  }

  const totalHectares = fields.reduce((sum, f) => sum + f.areaHectares, 0);
  const report = evaluateCompliance({
    totalHectares,
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: f.areaHectares,
      previousCrops: previousByField.get(f.id),
      treatmentsCountThisSeason: f.treatments.length,
      lastTreatmentAt: f.treatments[0]?.performedAt ?? null,
    })),
  });

  return {
    report,
    fields: fields.map((f) => ({ id: f.id, name: f.name, crop: f.crop, areaHectares: f.areaHectares })),
    totalHectares,
  };
}
