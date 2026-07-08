// Compliance WPR 2023-2027 / IJHARS.
// Analizuje strukturę gospodarstwa i historię zabiegów, zwraca raport zgodności.
//
// Reguły WPR 2023-2027 (UE) + normy GAEC (Good Agricultural and Environmental Condition):
//   - GAEC 7: dywersyfikacja upraw
//   - GAEC 8: minimum 4% EFA (Elementy Proekologiczne) na gruntach ornych
//   - Rotacja upraw od 2025: ta sama uprawa max 3 sezony na działce
//   - Obowiązek rejestracji zabiegów środkami ochrony roślin (Dz.U. 2022 poz. 2453)
//     - w ciągu 14 dni od zabiegu
//     - przechowywanie 3 lata

import { pluralPL } from '@/lib/ui/format';

export type ComplianceStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface ComplianceRule {
  id: string;
  category: 'diversification' | 'rotation' | 'registration' | 'efa' | 'soil-cover';
  title: string;
  status: ComplianceStatus;
  detail: string;
  action?: string;
  legalBasis: string;
}

export interface ComplianceReport {
  totalHectares: number;
  fieldsCount: number;
  rules: ComplianceRule[];
  /** Liczba reguł z statusem fail. */
  failCount: number;
  /** Liczba reguł ze statusem warn. */
  warnCount: number;
  /** Procentowa zgodność 0-100. */
  score: number;
}

export interface ComplianceFieldInput {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  /** Historia upraw w poprzednich sezonach (wyliczalne z Treatment.type='sowing' lub z ręcznej deklaracji). */
  previousCrops?: string[];
  /** Ostatni zabieg rejestrowany. */
  lastTreatmentAt?: Date | null;
  /** Liczba zabiegów w sezonie. */
  treatmentsCountThisSeason?: number;
}

export interface ComplianceInput {
  totalHectares: number;
  fields: ComplianceFieldInput[];
}

export function evaluateCompliance(input: ComplianceInput): ComplianceReport {
  const rules: ComplianceRule[] = [];
  const cropAreas = new Map<string, number>();
  for (const f of input.fields) {
    cropAreas.set(f.crop, (cropAreas.get(f.crop) ?? 0) + f.areaHectares);
  }
  const distinctCrops = cropAreas.size;
  const sortedCrops = [...cropAreas.entries()].sort((a, b) => b[1] - a[1]);

  // ── 1. Dywersyfikacja upraw (GAEC 7 / WPR 2023-2027) ──
  // Gospodarstwa 10-30 ha: min 2 uprawy, żadna >75%
  // Gospodarstwa >30 ha: min 3 uprawy, 2 największe ≤95% łącznie, każda min 5%
  if (input.totalHectares >= 10 && input.totalHectares <= 30) {
    const largestPct = sortedCrops[0] ? (sortedCrops[0][1] / input.totalHectares) * 100 : 0;
    const ok = distinctCrops >= 2 && largestPct <= 75;
    rules.push({
      id: 'diversification-small',
      category: 'diversification',
      title: 'Dywersyfikacja upraw (10-30 ha)',
      status: ok ? 'pass' : 'fail',
      detail: `${distinctCrops} upraw na ${input.totalHectares.toFixed(1)} ha. Największa: ${sortedCrops[0]?.[0] ?? '—'} = ${largestPct.toFixed(0)}%. Wymagane: ≥2 uprawy, żadna >75%.`,
      action: ok
        ? undefined
        : distinctCrops < 2
          ? 'Posiej drugą uprawę na min 25% powierzchni. Np. gryka, bobik, mieszanka strączkowa (też liczą się jako EFA).'
          : 'Główna uprawa zajmuje >75% — rozważ zmianę części powierzchni na drugą uprawę.',
      legalBasis: 'WPR 2023-2027, Rozporządzenie MRiRW 2022',
    });
  } else if (input.totalHectares > 30) {
    const top2Pct =
      sortedCrops.slice(0, 2).reduce((s, [, area]) => s + area, 0) / input.totalHectares * 100;
    const smallestPct = sortedCrops.length >= 3
      ? (sortedCrops[2][1] / input.totalHectares) * 100
      : 0;
    const ok = distinctCrops >= 3 && top2Pct <= 95 && smallestPct >= 5;
    rules.push({
      id: 'diversification-large',
      category: 'diversification',
      title: 'Dywersyfikacja upraw (>30 ha)',
      status: ok ? 'pass' : 'fail',
      detail: `${distinctCrops} upraw. Dwie największe: ${top2Pct.toFixed(0)}%. Trzecia: ${smallestPct.toFixed(0)}%. Wymagane: ≥3 uprawy, 2 największe ≤95%, każda ≥5%.`,
      action: ok
        ? undefined
        : 'Rozważ dodatkową uprawę (strączkowe + zbóż + rzepak to typowy safe mix).',
      legalBasis: 'WPR 2023-2027, GAEC 7',
    });
  }

  // ── 2. Rotacja upraw (obowiązek od 2025, GAEC 7 rozszerzony) ──
  // Na działkach >5 ha ta sama uprawa nie może zajmować więcej niż 3 sezony z rzędu.
  for (const f of input.fields) {
    if (f.areaHectares < 5) continue;
    if (!f.previousCrops || f.previousCrops.length === 0) continue;
    const last3 = f.previousCrops.slice(-3);
    const allSame = last3.length >= 3 && last3.every((c) => c === f.crop);
    if (allSame) {
      rules.push({
        id: `rotation-${f.id}`,
        category: 'rotation',
        title: `Rotacja upraw — pole "${f.name}"`,
        status: 'fail',
        detail: `${f.crop} 3 sezony z rzędu + planowana w tym roku. Narusza wymóg rotacji.`,
        action: `Zmień uprawę w tym roku lub podziel pole na części. Preferowane: strączkowe (wiążą azot, "regenerują" glebę) albo rzepak.`,
        legalBasis: 'GAEC 7 (od 2025)',
      });
    } else if (last3.length >= 2 && last3[last3.length - 1] === f.crop && last3[last3.length - 2] === f.crop) {
      rules.push({
        id: `rotation-warn-${f.id}`,
        category: 'rotation',
        title: `Rotacja upraw — pole "${f.name}"`,
        status: 'warn',
        detail: `${f.crop} 2 sezony z rzędu. W przyszłym roku musisz zmienić uprawę.`,
        action: `Zaplanuj inną uprawę na następny sezon (np. rzepak po pszenicy, strączkowe po zbożu).`,
        legalBasis: 'GAEC 7 (od 2025)',
      });
    }
  }

  // ── 3. Rejestracja zabiegów (obowiązek prawny) ──
  const now = Date.now();
  const fieldsWithoutTreatments = input.fields.filter(
    (f) => (f.treatmentsCountThisSeason ?? 0) === 0 && f.areaHectares >= 1,
  );
  const fieldsWithStaleRegistration = input.fields.filter((f) => {
    if (!f.lastTreatmentAt) return false;
    const daysAgo = (now - f.lastTreatmentAt.getTime()) / 864e5;
    return daysAgo > 30 && daysAgo < 200; // był zabieg dawno, pewnie ktoś zapomniał wpisywać
  });

  if (fieldsWithoutTreatments.length === 0) {
    rules.push({
      id: 'registration-complete',
      category: 'registration',
      title: 'Rejestracja zabiegów — kompletna',
      status: 'pass',
      detail: 'Wszystkie pola z obszarem ≥1 ha mają zarejestrowane zabiegi.',
      legalBasis: 'Dz.U. 2022 poz. 2453',
    });
  } else {
    rules.push({
      id: 'registration-missing',
      category: 'registration',
      title: 'Rejestracja zabiegów — braki',
      status: 'warn',
      detail: `${fieldsWithoutTreatments.length} ${pluralPL(fieldsWithoutTreatments.length, 'pole', 'pola', 'pól')} bez ani jednego zabiegu w sezonie: ${fieldsWithoutTreatments.map((f) => f.name).join(', ').slice(0, 200)}${fieldsWithoutTreatments.length > 5 ? '…' : ''}.`,
      action: 'Dopisz zabiegi wstecz w Księdze Polowej (IJHARS toleruje do 14 dni ale nie więcej).',
      legalBasis: 'Dz.U. 2022 poz. 2453 art. 25',
    });
  }

  if (fieldsWithStaleRegistration.length > 0) {
    rules.push({
      id: 'registration-stale',
      category: 'registration',
      title: 'Ostatni wpis >30 dni temu',
      status: 'info',
      detail: `${fieldsWithStaleRegistration.length} ${pluralPL(fieldsWithStaleRegistration.length, 'pole', 'pola', 'pól')} z ostatnim zabiegiem sprzed ponad miesiąca. Jeśli wykonywałeś prace — dopisz je.`,
      legalBasis: 'Dz.U. 2022 poz. 2453',
    });
  }

  // ── 4. GAEC 6 — zimowa okrywa gleby ──
  // Minimum 80% gruntów ornych z okrywą między 1 XI a 15 II.
  // Dla MVP: tylko informacja, bo wymaga deklaracji międzyplonów.
  rules.push({
    id: 'gaec-6-info',
    category: 'soil-cover',
    title: 'GAEC 6: okrywa gleby zimowa',
    status: 'info',
    detail: 'Minimum 80% gruntów ornych musi mieć okrywę między 1 listopada a 15 lutego. Zboża ozime, trawy, międzyplony ścierniskowe liczą się jako okrywa.',
    action: 'Jeśli większość pól ma uprawy jare — zaplanuj międzyplony ścierniskowe (gorczyca, facelia) lub siew ozimin.',
    legalBasis: 'GAEC 6 (WPR 2023-2027)',
  });

  // ── 5. EFA 4% (GAEC 8) — tylko info ──
  rules.push({
    id: 'gaec-8-info',
    category: 'efa',
    title: 'GAEC 8: minimum 4% EFA',
    status: 'info',
    detail: 'Gospodarstwa >10 ha muszą mieć ≥4% powierzchni gruntów ornych jako Elementy Proekologiczne (ugór, międzyplon, strączkowe, drzewa, miedze).',
    action: 'Zadeklaruj EFA w eWniosek Plus podczas wniosku obszarowego (do 15 maja).',
    legalBasis: 'GAEC 8 (WPR 2023-2027)',
  });

  const fails = rules.filter((r) => r.status === 'fail').length;
  const warns = rules.filter((r) => r.status === 'warn').length;
  const passes = rules.filter((r) => r.status === 'pass').length;
  const evaluated = passes + fails + warns;
  const score = evaluated > 0 ? Math.round((passes / evaluated) * 100) : 100;

  return {
    totalHectares: input.totalHectares,
    fieldsCount: input.fields.length,
    rules,
    failCount: fails,
    warnCount: warns,
    score,
  };
}
