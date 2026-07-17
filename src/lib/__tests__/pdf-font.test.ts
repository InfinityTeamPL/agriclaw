// @vitest-environment node
//
// Test regresyjny fixu P0-5: PDF księgi polowej pobierał czcionkę z
// raw.githubusercontent.com W TRAKCIE generowania. Przy awarii CDN dokument
// kontrolny (IJHARS/ARiMR) wychodził bez polskich znaków. Teraz czcionka jest
// wendorowana w repo i bundlowana do funkcji serverless.
//
// Ten test pilnuje, żeby ktoś tego nie cofnął: pliki muszą istnieć lokalnie,
// osadzać się BEZ sieci i realnie zawierać polskie glify.

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const REGULAR = path.join(process.cwd(), 'src/assets/fonts/pl-regular.ttf');
const BOLD = path.join(process.cwd(), 'src/assets/fonts/pl-bold.ttf');
const PDF_ROUTE = path.join(process.cwd(), 'src/app/api/treatments/export/pdf/route.ts');
const NEXT_CONFIG = path.join(process.cwd(), 'next.config.js');

// Znaki, których brakuje w standardowych czcionkach PDF (WinAnsi).
const POLISH_GLYPHS = 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ';

describe('czcionka PDF księgi polowej — offline, z polskimi znakami', () => {
  it('pliki czcionek są w repo (nie pobierane z sieci)', async () => {
    const regular = await readFile(REGULAR);
    const bold = await readFile(BOLD);
    expect(regular.length).toBeGreaterThan(50_000);
    expect(bold.length).toBeGreaterThan(50_000);
  });

  it('to prawdziwe pliki TTF/OTF, nie podmieniony HTML/placeholder', async () => {
    const regular = await readFile(REGULAR);
    // TTF zaczyna się od 0x00010000 (lub 'true'/'OTTO' dla wariantów).
    const magic = regular.subarray(0, 4).toString('hex');
    expect(['00010000', '74727565', '4f54544f']).toContain(magic);
  });

  it('osadza się w PDF bez sieci i renderuje polskie glify (nie .notdef)', async () => {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const bytes = await readFile(REGULAR);
    const font = await pdf.embedFont(bytes, { subset: true });

    // Każdy polski znak musi mieć niezerową szerokość — zero oznacza brak glifu
    // (czyli krzaki w dokumencie kontrolnym).
    for (const ch of POLISH_GLYPHS) {
      const width = font.widthOfTextAtSize(ch, 12);
      expect(width, `brak glifu dla "${ch}"`).toBeGreaterThan(0);
    }

    // Sanity: dokument z polskim tekstem faktycznie się zapisuje.
    const page = pdf.addPage([300, 100]);
    page.drawText('Pszenica ozima — zabieg 0,75 l/ha', { x: 10, y: 50, size: 10, font });
    const out = await pdf.save();
    expect(out.length).toBeGreaterThan(1000);
  });

  it('licencja OFL jest dołączona (wolno redystrybuować — inaczej niż Arial)', async () => {
    const license = await readFile(
      path.join(process.cwd(), 'src/assets/fonts/LICENSE-DejaVu.txt'),
      'utf8',
    );
    expect(license.length).toBeGreaterThan(200);
  });

  it('trasa PDF NIE pobiera czcionki z sieci w czasie żądania', async () => {
    const src = await readFile(PDF_ROUTE, 'utf8');
    expect(src).not.toMatch(/raw\.githubusercontent\.com/);
    expect(src).not.toMatch(/fetch\([^)]*\.ttf/);
    // Czyta z lokalnego katalogu assets.
    expect(src).toMatch(/src\/assets\/fonts/);
  });

  it('bundling czcionki do funkcji serverless jest zadeklarowany', async () => {
    const cfg = await readFile(NEXT_CONFIG, 'utf8');
    expect(cfg).toMatch(/outputFileTracingIncludes/);
    expect(cfg).toMatch(/assets\/fonts/);
  });
});
