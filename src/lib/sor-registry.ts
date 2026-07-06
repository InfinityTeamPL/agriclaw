// Rejestr ŚOR (MRiRW) — import z dane.gov.pl (dataset 550, CC0) i walidacja
// zaleceń agenta. Domyka systemowo zasadę „wsparcie decyzji" (lib/advisory.ts):
// zamiast hardcodowanych substancji agent sprawdza ŻYWY rejestr dopuszczeń.
//
// Ważne ograniczenie danych: KARENCJA i szczegółowe środki ostrożności są TYLKO
// na etykiecie PDF — nigdy ich nie generujemy, zawsze odsyłamy do etykiety.
// Research + zweryfikowana struktura plików: docs/research/sor-mrirw-integracja-2026.md

import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { fetchWithTimeout } from './satellite/http';

const DATASET_RESOURCES_URL =
  'https://api.dane.gov.pl/1.4/datasets/550/resources?sort=-created&per_page=24';
const RESOURCE_FILE_URL = (id: string) => `https://api.dane.gov.pl/resources/${id}/file`;

// ── Typy wierszy z plików rejestru (kolumny zweryfikowane na wydaniu 26.06.2026) ──

export interface RegistryProductRow {
  id_sor: string;
  nazwa: string;
  producent_prosty?: string;
  NrZezw?: string;
  Rodzaj?: string;
  Zawartosc_SBCZ_prosty?: string;
  TerminZezw?: Date | number | null;
  TerminDopSprzedazy?: Date | number | null;
  TerminDopuszczenia?: Date | number | null;
  etykieta?: string;
  BazowySor?: string;
}

export interface RegistryApplicationRow {
  id_sor: string;
  uprawa?: string;
  agrofag?: string;
  dawka?: string;
  termin?: string;
  maloobszarowe?: string | number | boolean | null;
  metody_stosowania?: string;
}

// ── Czyste funkcje (testowalne bez DB) ──

/** Excel przechowuje daty jako liczbę dni od 1900 — konwersja na Date (UTC). */
export function excelDateToUtc(value: Date | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return null;
  // Epoka Excela: 1899-12-30 (uwzględnia błąd roku przestępnego 1900)
  const ms = Math.round((value - 25569) * 86400 * 1000);
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

export type SorStatus =
  | 'aktualny' // zezwolenie aktywne
  | 'wyprzedaz' // zezwolenie wygasło, ale sprzedaż i stosowanie jeszcze dozwolone
  | 'do_zuzycia' // sprzedaż zakończona, stosowanie jeszcze dozwolone (do useTo)
  | 'wycofany'; // stosowanie już NIEDOZWOLONE

/** Numer dnia kalendarzowego UTC — terminy rejestru („do dnia X") są WŁĄCZNE. */
function utcDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000);
}

/**
 * Status prawny produktu na dany dzień — na podstawie trzech terminów rejestru.
 * Porównania KALENDARZOWE (dzień terminu to ostatni dzień danego statusu) —
 * porównanie timestampów oznaczałoby „wycofany" przez cały ostatni legalny dzień.
 */
export function computeStatus(
  p: { permitTo: Date | null; saleTo: Date | null; useTo: Date | null },
  today: Date,
): SorStatus {
  const t = utcDayNumber(today);
  // Koniec stosowania jest rozstrzygający: po useTo środka NIE WOLNO stosować.
  if (p.useTo && t > utcDayNumber(p.useTo)) return 'wycofany';
  if (p.permitTo && t > utcDayNumber(p.permitTo)) {
    if (p.saleTo && t > utcDayNumber(p.saleTo)) return 'do_zuzycia';
    return 'wyprzedaz';
  }
  return 'aktualny';
}

const PL_FOLD: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

/** Normalizacja do porównań: lower-case + bez polskich znaków + pojedyncze spacje. */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => PL_FOLD[ch] ?? ch)
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapowanie kodów upraw AgriClaw → frazy rejestru. Rejestr rozróżnia PRAWNIE
// odrębne uprawy ("burak cukrowy" ≠ "burak ćwikłowy", "żyto" ≠ "pszenżyto",
// "kukurydza" ≠ "kukurydza cukrowa") — dopasowanie musi być tokenowe (początek
// frazy uprawy) z wykluczeniami, inaczej autoryzujemy środek w złej uprawie
// (przegląd adwersaryjny: 419 produktów pszenżyta łapało się na kod "rye").
const CROP_MATCH: Record<string, { include: string[]; exclude: string[] }> = {
  wheat: { include: ['pszenica'], exclude: ['orkisz', 'twarda', 'samopsza', 'plaskurka'] },
  barley: { include: ['jeczmien'], exclude: [] },
  rye: { include: ['zyto'], exclude: [] }, // tokenowo: "pszenzyto" NIE zaczyna się od "zyto"
  oats: { include: ['owies'], exclude: [] },
  corn: { include: ['kukurydza'], exclude: ['cukrowa'] },
  rapeseed: { include: ['rzepak'], exclude: [] },
  potato: { include: ['ziemniak'], exclude: [] },
  sugarbeet: { include: ['burak cukrowy'], exclude: [] },
};

/** Czy kod uprawy AgriClaw ma mapowanie na frazy rejestru? */
export function isCropCodeSupported(appCropCode: string): boolean {
  return appCropCode in CROP_MATCH;
}

/**
 * Czy tekst uprawy z rejestru pasuje do kodu uprawy AgriClaw?
 * Komórka `uprawa` bywa listą ("pszenica ozima, pszenżyto ozime") — dzielimy
 * po przecinkach i dopasowujemy KAŻDY token od początku frazy (startsWith),
 * z wykluczeniami dla prawnie odrębnych odmian.
 */
export function cropMatches(registryCrop: string, appCropCode: string): boolean {
  const rule = CROP_MATCH[appCropCode];
  if (!rule) return false;
  const tokens = normalizeName(registryCrop)
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
  return tokens.some(
    (tok) =>
      rule.include.some((n) => tok.startsWith(n)) &&
      !rule.exclude.some((x) => tok.includes(x)),
  );
}

/**
 * Z listy zasobów datasetu 550 wybiera najnowsze KOMPLETNE wydanie
 * (rejestr podstawowy + rejestr zastosowań z tą samą datą w tytule).
 */
export function pickLatestRelease(
  resources: Array<{ id: string | number; title: string }>,
): { label: string; basicId: string; applicationsId: string } | null {
  const byDate = new Map<string, { basicId?: string; applicationsId?: string }>();
  for (const r of resources) {
    const m = r.title.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (!m) continue;
    const entry = byDate.get(m[1]) ?? {};
    const t = r.title.toLowerCase();
    // Lista jest posortowana -created (najnowszy pierwszy) — przy korekcie
    // wydania z tą samą datą wygrywa PIERWSZY napotkany (świeższy) zasób.
    if (t.includes('rejestr podstawowy') && !entry.basicId) entry.basicId = String(r.id);
    if (t.includes('rejestr zastosowa') && !entry.applicationsId) entry.applicationsId = String(r.id);
    byDate.set(m[1], entry);
  }
  // Sortuj daty malejąco (dd.mm.yyyy → yyyy-mm-dd)
  const sorted = [...byDate.entries()].sort((a, b) => {
    const key = (s: string) => s.split('.').reverse().join('-');
    return key(b[0]).localeCompare(key(a[0]));
  });
  for (const [label, e] of sorted) {
    if (e.basicId && e.applicationsId) {
      return { label, basicId: e.basicId, applicationsId: e.applicationsId };
    }
  }
  return null;
}

/** Parsuje oba skoroszyty wydania do znormalizowanych rekordów (bez DB). */
export function parseRelease(basicBuf: ArrayBuffer, applicationsBuf: ArrayBuffer): {
  products: Array<{
    id: string; name: string; producer: string | null; permitNo: string | null;
    kind: string | null; substances: string | null;
    permitTo: Date | null; saleTo: Date | null; useTo: Date | null;
    labelPage: string | null; baseSor: string | null;
  }>;
  applications: Array<{
    sorId: string; crop: string; pest: string | null; dose: string | null;
    term: string | null; minorUse: boolean; methods: string | null;
  }>;
} {
  const wb1 = XLSX.read(basicBuf, { cellDates: false });
  const rows1 = XLSX.utils.sheet_to_json<RegistryProductRow>(wb1.Sheets[wb1.SheetNames[0]]);
  const productList = rows1
    .filter((r) => r.id_sor && r.nazwa)
    .map((r) => ({
      id: String(r.id_sor).trim(),
      name: String(r.nazwa).trim(),
      producer: r.producent_prosty ? String(r.producent_prosty).trim() : null,
      permitNo: r.NrZezw ? String(r.NrZezw).trim() : null,
      kind: r.Rodzaj ? String(r.Rodzaj).trim() : null,
      substances: r.Zawartosc_SBCZ_prosty ? String(r.Zawartosc_SBCZ_prosty).trim() : null,
      permitTo: excelDateToUtc(r.TerminZezw),
      saleTo: excelDateToUtc(r.TerminDopSprzedazy),
      useTo: excelDateToUtc(r.TerminDopuszczenia),
      labelPage: r.etykieta ? String(r.etykieta).trim() : null,
      baseSor: r.BazowySor ? String(r.BazowySor).trim() : null,
    }));

  // Deduplikacja po id_sor (PK) — jeden zdublowany wiersz w pliku MRiRW nie może
  // wysadzać całej transakcji importu (rollback → rejestr zamiera na starym wydaniu).
  const byId = new Map<string, (typeof productList)[number]>();
  for (const p of productList) byId.set(p.id, p); // ostatni wygrywa
  const products = [...byId.values()];
  if (products.length !== productList.length) {
    console.warn(`sor-registry: odrzucono ${productList.length - products.length} duplikatów id_sor`);
  }

  const productIds = new Set(products.map((p) => p.id));
  const wb2 = XLSX.read(applicationsBuf, { cellDates: false });
  const rows2 = XLSX.utils.sheet_to_json<RegistryApplicationRow>(wb2.Sheets[wb2.SheetNames[0]]);
  const applications = rows2
    .filter((r) => r.id_sor && r.uprawa && productIds.has(String(r.id_sor).trim()))
    .map((r) => ({
      sorId: String(r.id_sor).trim(),
      crop: String(r.uprawa).trim(),
      pest: r.agrofag ? String(r.agrofag).trim() : null,
      dose: r.dawka ? String(r.dawka).trim() : null,
      term: r.termin ? String(r.termin).trim() : null,
      minorUse: r.maloobszarowe != null && String(r.maloobszarowe).trim() !== '' && String(r.maloobszarowe) !== '0',
      methods: r.metody_stosowania ? String(r.metody_stosowania).trim() : null,
    }));

  return { products, applications };
}

// ── Import (DB) ──

export interface SorSyncResult {
  status: 'imported' | 'up_to_date' | 'no_release';
  releaseLabel?: string;
  products?: number;
  applications?: number;
}

/**
 * Sprawdza najnowsze wydanie na dane.gov.pl i importuje je, jeśli jeszcze
 * nie mamy. Idempotencja po ID ZASOBÓW (nie samej dacie) — korekta wydania
 * z tą samą datą dostaje nowe id zasobów i zostanie zaimportowana.
 * Import = pełna podmiana tabel (replace-all) w transakcji.
 * `force` pomija guard spadku liczności (recovery po złym wydaniu) — ale nie
 * pomija absolutnych minimów sanity.
 */
export async function syncSorRegistry(opts?: { force?: boolean }): Promise<SorSyncResult> {
  const listRes = await fetchWithTimeout(DATASET_RESOURCES_URL, {
    timeoutMs: 20_000,
    retries: 1,
    headers: { Accept: 'application/json' },
  });
  if (!listRes.ok) throw new Error(`dane.gov.pl lista zasobów: HTTP ${listRes.status}`);
  const list = (await listRes.json()) as {
    data?: Array<{ id: string | number; attributes?: { title?: string } }>;
  };
  const release = pickLatestRelease(
    (list.data ?? []).map((r) => ({ id: r.id, title: r.attributes?.title ?? '' })),
  );
  if (!release) return { status: 'no_release' };

  const lastImport = await prisma.sorImport.findFirst({ orderBy: { importedAt: 'desc' } });
  if (
    lastImport &&
    lastImport.basicResourceId === release.basicId &&
    lastImport.applicationsResourceId === release.applicationsId &&
    !opts?.force
  ) {
    return { status: 'up_to_date', releaseLabel: release.label };
  }

  const [basicRes, appsRes] = await Promise.all([
    fetchWithTimeout(RESOURCE_FILE_URL(release.basicId), { timeoutMs: 60_000, retries: 1 }),
    fetchWithTimeout(RESOURCE_FILE_URL(release.applicationsId), { timeoutMs: 60_000, retries: 1 }),
  ]);
  if (!basicRes.ok || !appsRes.ok) {
    throw new Error(`Pobieranie plików rejestru: ${basicRes.status}/${appsRes.status}`);
  }
  const { products, applications } = parseRelease(
    await basicRes.arrayBuffer(),
    await appsRes.arrayBuffer(),
  );
  // Sanity absolutne: rejestr ma ~3 tys. produktów i ~18 tys. zastosowań.
  // Uszkodzony/pusty plik NIE MOŻE skasować dobrych danych (replace-all!).
  if (products.length < 100) {
    throw new Error(`Podejrzanie mało produktów (${products.length}) — przerywam import`);
  }
  if (applications.length < 1000) {
    throw new Error(`Podejrzanie mało zastosowań (${applications.length}) — przerywam import`);
  }
  // Guard względny: spadek >50% vs poprzedni import = prawdopodobnie zły plik.
  if (!opts?.force && lastImport) {
    if (products.length < lastImport.products * 0.5 || applications.length < lastImport.applications * 0.5) {
      throw new Error(
        `Liczność spadła o >50% vs poprzedni import (${products.length}/${lastImport.products} produktów, ` +
          `${applications.length}/${lastImport.applications} zastosowań) — przerwane; użyj force=1 po weryfikacji`,
      );
    }
  }

  const CHUNK = 1000;
  await prisma.$transaction(
    async (tx) => {
      await tx.sorApplication.deleteMany();
      await tx.sorProduct.deleteMany();
      for (let i = 0; i < products.length; i += CHUNK) {
        await tx.sorProduct.createMany({ data: products.slice(i, i + CHUNK) });
      }
      for (let i = 0; i < applications.length; i += CHUNK) {
        await tx.sorApplication.createMany({ data: applications.slice(i, i + CHUNK) });
      }
      await tx.sorImport.create({
        data: {
          releaseLabel: release.label,
          basicResourceId: release.basicId,
          applicationsResourceId: release.applicationsId,
          products: products.length,
          applications: applications.length,
        },
      });
    },
    { timeout: 120_000 },
  );

  return {
    status: 'imported',
    releaseLabel: release.label,
    products: products.length,
    applications: applications.length,
  };
}

// ── Walidacja zaleceń (używana przez skill agenta i diagnozę) ──

export interface SorCheckResult {
  found: boolean;
  query: string;
  releaseLabel: string | null; // wersja rejestru, na której oparto odpowiedź
  /** Czy nazwa z rejestru jest DOKŁADNIE tym, o co pytano (case/spacje-insensitive). */
  exactMatch?: boolean;
  /** Czy było kilku kandydatów bez dokładnego dopasowania (wynik = najlepszy strzał). */
  ambiguous?: boolean;
  product?: {
    name: string; // nazwa Z REJESTRU — pokazuj ją zawsze, nie nazwę z zapytania
    kind: string | null;
    substances: string | null;
    status: SorStatus;
    useTo: string | null; // ISO date
    labelPage: string | null;
  };
  /** true/false gdy uprawę umiemy zweryfikować; undefined gdy kod uprawy nieznany. */
  cropAuthorized?: boolean;
  applications?: Array<{ crop: string; pest: string | null; dose: string | null; term: string | null }>;
  note: string;
}

/**
 * Sprawdza produkt w rejestrze po nazwie handlowej: najpierw dopasowanie
 * DOKŁADNE, potem zawierające (z preferencją prefiksu). Opcjonalne zawężenie
 * do uprawy (kod AgriClaw) — nieznany kod NIE udaje braku rejestracji.
 */
export async function checkSorProduct(query: string, cropCode?: string): Promise<SorCheckResult> {
  const lastImport = await prisma.sorImport.findFirst({ orderBy: { importedAt: 'desc' } });
  const releaseLabel = lastImport?.releaseLabel ?? null;
  const q = query.trim();
  if (!q) {
    return { found: false, query, releaseLabel, note: 'Pusta nazwa produktu.' };
  }

  // 1) Dokładne dopasowanie (insensitive) — bez okna take, więc nie przegra
  //    z alfabetem przy wielu kandydatach contains.
  let product = await prisma.sorProduct.findFirst({
    where: { name: { equals: q, mode: 'insensitive' } },
    include: { applications: true },
  });
  let exactMatch = !!product;
  let ambiguous = false;

  if (!product) {
    const candidates = await prisma.sorProduct.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      include: { applications: true },
      take: 10,
      orderBy: { name: 'asc' },
    });
    if (candidates.length === 0) {
      return {
        found: false,
        query,
        releaseLabel,
        note: 'Brak produktu o tej nazwie w rejestrze MRiRW — nie zalecaj go. Sprawdź pisownię albo zaproponuj rolnikowi wyszukiwarkę: https://www.gov.pl/web/rolnictwo/wyszukiwarka-srodkow-ochrony-roslin',
      };
    }
    // Preferuj kandydatów zaczynających się od zapytania ("Amistar" → "Amistar
    // 250 SC", nie "X-Amistar"), wśród nich najkrótszą nazwę (wariant bazowy).
    const nq = normalizeName(q);
    const prefix = candidates.filter((c) => normalizeName(c.name).startsWith(nq));
    const pool = prefix.length > 0 ? prefix : candidates;
    product = [...pool].sort((a, b) => a.name.length - b.name.length)[0];
    ambiguous = candidates.length > 1;
  }

  const today = new Date();
  const status = computeStatus(
    { permitTo: product.permitTo, saleTo: product.saleTo, useTo: product.useTo },
    today,
  );

  // Nieznany kod uprawy (np. 'other') ≠ brak rejestracji — wtedy nie filtrujemy
  // i zwracamy cropAuthorized=undefined (nie umiemy zweryfikować).
  const cropKnown = cropCode ? isCropCodeSupported(cropCode) : false;
  const apps = cropKnown
    ? product.applications.filter((a) => cropMatches(a.crop, cropCode!))
    : product.applications;
  const cropAuthorized = cropKnown ? apps.length > 0 : undefined;

  const noteParts: string[] = [];
  if (!exactMatch) {
    noteParts.push(
      `Dopasowano do „${product.name}"${ambiguous ? ' (kilku kandydatów — dopasowanie niepewne)' : ''} — upewnij się, że o TEN produkt chodzi.`,
    );
  }
  if (status === 'wycofany') {
    noteParts.push('ŚRODEK WYCOFANY — stosowanie NIEDOZWOLONE. Nie zalecaj.');
  } else if (status === 'do_zuzycia' || status === 'wyprzedaz') {
    noteParts.push(`Zezwolenie wygasa — status "${status}", stosowanie dozwolone do ${product.useTo?.toISOString().slice(0, 10) ?? '?'}.`);
  }
  if (cropKnown && !cropAuthorized) {
    noteParts.push('Brak zarejestrowanego zastosowania w tej uprawie — nie zalecaj do tej uprawy.');
  } else if (cropCode && !cropKnown) {
    noteParts.push(`Nie umiem zweryfikować uprawy dla kodu "${cropCode}" — sprawdź listę zastosowań i etykietę.`);
  }
  noteParts.push('Karencja i pełne warunki: TYLKO etykieta produktu (link poniżej).');

  return {
    found: true,
    query,
    releaseLabel,
    exactMatch,
    ambiguous,
    product: {
      name: product.name,
      kind: product.kind,
      substances: product.substances,
      status,
      useTo: product.useTo ? product.useTo.toISOString().slice(0, 10) : null,
      labelPage: product.labelPage,
    },
    cropAuthorized,
    applications: apps.slice(0, 8).map((a) => ({
      crop: a.crop,
      pest: a.pest,
      dose: a.dose,
      term: a.term,
    })),
    note: noteParts.join(' '),
  };
}
