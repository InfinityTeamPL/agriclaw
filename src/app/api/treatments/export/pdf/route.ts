// GET /api/treatments/export/pdf — eksport księgi polowej do PDF (IJHARS format).
// Używamy pdf-lib (pure TS, serverless-friendly, nie wymaga Chromium).
// Polska czcionka DejaVu Sans (OFL) przez embeddedFont (Standard-font nie ma polskich znaków).

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Route czyta pliki czcionek z dysku (fs) — wymagany runtime Node.js.
export const runtime = 'nodejs';
export const maxDuration = 60;

// Polska czcionka osadzona LOKALNIE w repo (src/assets/fonts). PDF trafia do
// kontroli IJHARS/ARiMR, więc generowanie NIE może zależeć od sieci/CDN — brak
// odpowiedzi CDN wcześniej powodował dokument bez polskich znaków. DejaVu Sans
// (licencja OFL, wolno redystrybuować) ma pełne pokrycie znaków polskich
// (ą ć ę ł ń ó ś ź ż). Pliki muszą trafić do bundla funkcji serverless —
// patrz outputFileTracingIncludes w next.config.js.
const FONT_REGULAR_PATH = path.join(process.cwd(), 'src/assets/fonts/pl-regular.ttf');
const FONT_BOLD_PATH = path.join(process.cwd(), 'src/assets/fonts/pl-bold.ttf');

async function readFontFile(absPath: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(absPath));
}

// Simple text wrapper — zwraca tablicę linii mieszczących się w maxWidth
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function GET(req: NextRequest) {
  const { user } = await requireAuth();
  const fieldId = req.nextUrl.searchParams.get('fieldId');

  // Farm info dla nagłówka
  const farms = await prisma.farm.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, address: true },
    orderBy: { createdAt: 'asc' },
  });
  const farm = farms[0];
  if (!farm) return NextResponse.json({ error: 'No farm' }, { status: 404 });

  // Zabiegi
  const treatments = await prisma.treatment.findMany({
    where: {
      field: { farmId: farm.id },
      ...(fieldId ? { fieldId } : {}),
    },
    include: { field: { select: { name: true, crop: true, areaHectares: true } } },
    orderBy: { performedAt: 'desc' },
    take: 500,
  });

  // PDF creation
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Załaduj polską czcionkę z LOKALNYCH plików (bez sieci). Gdyby jeden z plików
  // był nieczytelny, fallbackiem jest DRUGA lokalna czcionka (nadal z polskimi
  // znakami) — nigdy Helvetica bez PL, bo to dokument kontrolny.
  let regularBytes: Uint8Array | null = null;
  let boldBytes: Uint8Array | null = null;
  try {
    regularBytes = await readFontFile(FONT_REGULAR_PATH);
  } catch {
    regularBytes = null;
  }
  try {
    boldBytes = await readFontFile(FONT_BOLD_PATH);
  } catch {
    boldBytes = null;
  }
  // Fallback krzyżowy: brakującą odmianę zastępujemy tą, która się wczytała.
  regularBytes ??= boldBytes;
  boldBytes ??= regularBytes;
  if (!regularBytes || !boldBytes) {
    return NextResponse.json(
      { error: 'Brak osadzonej czcionki z polskimi znakami (src/assets/fonts).' },
      { status: 500 },
    );
  }

  // { subset: true } — do PDF trafiają tylko realnie użyte glify (mały plik wyjściowy).
  const font: PDFFont = await pdf.embedFont(regularBytes, { subset: true });
  const fontBold: PDFFont = await pdf.embedFont(boldBytes, { subset: true });

  const pageWidth = 841.89; // A4 landscape
  const pageHeight = 595.28;
  const margin = 40;

  let page: PDFPage = pdf.addPage([pageWidth, pageHeight]);

  // Header
  const drawHeader = (p: PDFPage) => {
    p.drawText('Księga polowa — rejestr zabiegów agrotechnicznych', {
      x: margin,
      y: pageHeight - margin,
      size: 14,
      font: fontBold,
      color: rgb(0.06, 0.3, 0.15),
    });
    p.drawText(
      `Gospodarstwo: ${farm.name}  ·  ${farm.address}`,
      { x: margin, y: pageHeight - margin - 18, size: 9, font, color: rgb(0.4, 0.4, 0.4) },
    );
    p.drawText(
      `Okres: ${treatments[treatments.length - 1]?.performedAt.toISOString().slice(0, 10) ?? '—'} do ${treatments[0]?.performedAt.toISOString().slice(0, 10) ?? '—'}`,
      { x: margin, y: pageHeight - margin - 30, size: 9, font, color: rgb(0.4, 0.4, 0.4) },
    );
    p.drawText(
      `Wygenerowano: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · Podstawa prawna: Dz.U. 2022 poz. 2453`,
      { x: margin, y: pageHeight - margin - 42, size: 8, font, color: rgb(0.5, 0.5, 0.5) },
    );
  };

  drawHeader(page);

  // Table header
  const columns = [
    { label: 'Data', width: 60 },
    { label: 'Pole', width: 95 },
    { label: 'Uprawa', width: 60 },
    { label: 'Typ', width: 55 },
    { label: 'Produkt', width: 110 },
    { label: 'Subst. czynna', width: 110 },
    { label: 'Dawka', width: 55 },
    { label: 'Pow. (ha)', width: 48 },
    { label: 'Karencja', width: 40 },
    { label: 'Operator', width: 70 },
  ];
  const tableStartY = pageHeight - margin - 65;
  const rowHeight = 22;
  let y = tableStartY;

  const drawTableHeader = (p: PDFPage) => {
    let x = margin;
    p.drawRectangle({
      x: margin,
      y: y - 14,
      width: columns.reduce((s, c) => s + c.width, 0),
      height: 18,
      color: rgb(0.06, 0.3, 0.15),
    });
    for (const col of columns) {
      p.drawText(col.label, {
        x: x + 3,
        y: y - 10,
        size: 8.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      x += col.width;
    }
    y -= 18;
  };

  drawTableHeader(page);

  const typeLabels: Record<string, string> = {
    spray: 'Oprysk',
    fertilizer: 'Nawożenie',
    sowing: 'Siew',
    harvest: 'Zbiór',
    tillage: 'Uprawa',
    irrigation: 'Nawadnianie',
    mowing: 'Koszenie',
    other: 'Inne',
  };

  const cropLabels: Record<string, string> = {
    wheat: 'pszenica',
    corn: 'kukurydza',
    rapeseed: 'rzepak',
    barley: 'jęczmień',
    potato: 'ziemniak',
    rye: 'żyto',
    oats: 'owies',
    sugarbeet: 'burak',
    other: 'inna',
  };

  // Rows
  for (let i = 0; i < treatments.length; i++) {
    if (y < margin + 30) {
      // Nowa strona
      page.drawText(
        `Strona ${pdf.getPageCount()} · rekordy ${i + 1}–${Math.min(i + 25, treatments.length)}`,
        { x: margin, y: margin, size: 7, font, color: rgb(0.5, 0.5, 0.5) },
      );
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader(page);
      y = pageHeight - margin - 65;
      drawTableHeader(page);
    }

    const t = treatments[i];
    const cells = [
      t.performedAt.toISOString().slice(0, 10),
      t.field.name.slice(0, 18),
      cropLabels[t.field.crop] ?? t.field.crop,
      typeLabels[t.type] ?? t.type,
      t.productName.slice(0, 22),
      (t.activeSubstance ?? '').slice(0, 24),
      t.doseValue ? `${t.doseValue} ${t.doseUnit ?? ''}`.trim() : '—',
      t.areaTreated.toFixed(2),
      t.preHarvestIntervalDays ? `${t.preHarvestIntervalDays} dni` : '—',
      (t.operatorName ?? '').slice(0, 14),
    ];

    // Alternate row background
    if (i % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - 14,
        width: columns.reduce((s, c) => s + c.width, 0),
        height: rowHeight - 4,
        color: rgb(0.96, 0.98, 0.96),
      });
    }

    let x = margin;
    for (let c = 0; c < columns.length; c++) {
      page.drawText(cells[c], {
        x: x + 3,
        y: y - 9,
        size: 8,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      x += columns[c].width;
    }

    y -= rowHeight;
  }

  // Footer last page
  page.drawLine({
    start: { x: margin, y: margin + 40 },
    end: { x: margin + 150, y: margin + 40 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText('Podpis rolnika / osoby upoważnionej', {
    x: margin,
    y: margin + 28,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(
    `AgriClaw · Niniejszy dokument stanowi wyciąg z elektronicznej księgi polowej. Dane mogą być przedmiotem kontroli IJHARS/ARiMR.`,
    { x: margin, y: margin + 5, size: 7, font, color: rgb(0.6, 0.6, 0.6) },
  );

  const bytes = await pdf.save();
  const filename = `ksiega-polowa-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
