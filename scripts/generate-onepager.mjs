// Generuje one-pager AGROSTRATEG (A4 PDF) do rozmów z konsorcjantami (IUNG/SGGW/ODR).
// Treść: sekcje 1-3 z docs/funding/wniosek-agrostrateg-2026.md (skrót).
// Uruchomienie: node scripts/generate-onepager.mjs
// Wynik: docs/funding/one-pager-agrostrateg-IUNG.pdf

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'docs/funding/one-pager-agrostrateg-IUNG.pdf';

// ── Rampa NDVI — sygnatura marki AgriClaw ──
const NDVI_RAMP = ['#7f1d1d', '#dc2626', '#f97316', '#facc15', '#84cc16', '#16a34a', '#14532d'];
const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const INK = rgb(0.09, 0.1, 0.09);
const MUTED = rgb(0.38, 0.4, 0.38);
const GREEN = hex('#14532d');
const LINE = rgb(0.85, 0.87, 0.85);

const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);
const regular = await doc.embedFont(readFileSync('C:/Windows/Fonts/arial.ttf'), { subset: true });
const bold = await doc.embedFont(readFileSync('C:/Windows/Fonts/arialbd.ttf'), { subset: true });

const page = doc.addPage([595.28, 841.89]); // A4
const M = 46; // margines
const W = 595.28 - 2 * M;
let y = 841.89 - M;

function wrap(font, text, size, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const probe = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(probe, size) <= maxWidth) line = probe;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function text(str, { font = regular, size = 9.5, color = INK, x = M, maxWidth = W, lh = 1.35, spaceAfter = 0 } = {}) {
  for (const ln of wrap(font, str, size, maxWidth)) {
    y -= size * lh;
    page.drawText(ln, { x, y, size, font, color });
  }
  y -= spaceAfter;
}

function heading(str, { spaceBefore = 12 } = {}) {
  y -= spaceBefore;
  // mono-nagłówek w stylu HUD
  page.drawText(str.toUpperCase(), { x: M, y: y - 8, size: 8, font: bold, color: GREEN });
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.6, color: LINE });
  y -= 4;
}

function bullet(str, { size = 9.5 } = {}) {
  const bx = M + 10;
  const lines = wrap(regular, str, size, W - 14);
  let first = true;
  for (const ln of lines) {
    y -= size * 1.35;
    if (first) page.drawCircle({ x: M + 3, y: y + 3, size: 1.4, color: GREEN });
    page.drawText(ln, { x: bx, y, size, font: regular, color: INK });
    first = false;
  }
}

// ── Keyline NDVI na górze ──
const segW = (595.28) / NDVI_RAMP.length;
NDVI_RAMP.forEach((c, i) => {
  page.drawRectangle({ x: i * segW, y: 841.89 - 4, width: segW, height: 4, color: hex(c) });
});
y -= 10;

// ── Nagłówek ──
page.drawText('AgriClaw', { x: M, y: y - 20, size: 22, font: bold, color: INK });
page.drawText('CYFROWY AGRONOM · SENTINEL-1/2 + AGENT AI PO POLSKU', {
  x: M, y: y - 33, size: 7.5, font: bold, color: GREEN,
});
page.drawText('Propozycja konsorcjum · NCBR AGROSTRATEG I (T3 Rolnictwo cyfrowe)', {
  x: M, y: y - 46, size: 9.5, font: regular, color: MUTED,
});
page.drawText('Nabór do 28.08.2026', { x: M + W - bold.widthOfTextAtSize('Nabór do 28.08.2026', 10), y: y - 20, size: 10, font: bold, color: hex('#dc2626') });
y -= 56;

// ── Projekt ──
heading('Projekt: AGRO-ORBITA');
text('Cyfrowy agronom AI dla gospodarstw 10–200 ha — integracja teledetekcji satelitarnej Sentinel-1/2 z konwersacyjną sztuczną inteligencją w języku polskim, walidowana na 100 gospodarstwach pilotażowych.', { font: bold, size: 10, spaceAfter: 4 });
text('83% firm agrotech wskazuje deficyt kompetencji cyfrowych rolników jako główną barierę cyfryzacji. Istniejące narzędzia (mapy NDVI, panele analityczne) wymagają wiedzy eksperckiej. Projekt odwraca paradygmat interfejsu: zamiast panelu z mapami rolnik otrzymuje ostrożnie sformułowane wsparcie decyzji w języku polskim przez WhatsApp — z automatyczną weryfikacją zaleceń względem rejestru ŚOR (MRiRW), pogody, fazy BBCH i przepisów.', { spaceAfter: 2 });

// ── Dlaczego teraz / TRL ──
heading('Punkt startu: działający produkt (TRL 6)');
bullet('Platforma DZIAŁA na produkcji: NDVI/NDRE/NDWI/SAVI z maską chmur SCL, radar Sentinel-1 (widzi przez chmury), Planet 3 m, diagnoza chorób ze zdjęcia (LLM), e-księga zabiegów, zgodność GAEC/ARiMR, plan azotowy.');
bullet('Agent AI na WhatsApp z dyscypliną „wsparcie decyzji, nie polecenie" — framing zweryfikowany z ekspertem akademickim (lipiec 2026) i zabezpieczony systemowo poza modelem.');
bullet('Cel projektu: TRL 6 → 9. Badania: polskojęzyczny agent agronomiczny odporny na halucynacje (benchmark „AgroHalu-PL" — pierwszy taki), modele predykcji chorób kalibrowane do PL, walidacja polowa 2 sezony.');

// ── Konsorcjum ──
heading('Proponowane konsorcjum (budżet ~9,4 mln zł / 36 mies.)');
const rows = [
  ['AgriClaw (lider, przedsiębiorca)', '45%', 'platforma, agent AI, komercjalizacja'],
  ['IUNG-PIB Puławy', '28%', 'modele agronomiczne, kalibracja progów PL, dane suszowe'],
  ['SGGW / Politechnika Poznańska', '15%', 'badania NLP/LLM, benchmark halucynacji, publikacje'],
  ['ODR wojewódzki', '12%', 'rekrutacja 100 gospodarstw, walidacja polowa, szkolenia'],
];
for (const [name, pct, role] of rows) {
  y -= 13;
  page.drawText(name, { x: M + 10, y, size: 9, font: bold, color: INK });
  page.drawText(pct, { x: M + 250, y, size: 9, font: bold, color: GREEN });
  page.drawText(role, { x: M + 285, y, size: 8.5, font: regular, color: MUTED });
}
y -= 6;
text('Warunki naboru potwierdzone (gov.pl/ncbr, stan 06.2026): budżet konkursu 300 mln zł, dofinansowanie 1–25 mln zł, konsorcjum max 5 podmiotów (≥1 firma + ≥1 organizacja badawcza).', { size: 8.5, color: MUTED, spaceAfter: 2 });

// ── Wskaźniki ──
heading('Kluczowe wskaźniki');
bullet('100 gospodarstw pilotażowych (≥5 000 ha), 2 sezony wegetacyjne, protokół z grupą kontrolną.');
bullet('Redukcja zużycia azotu ≥8% i zabiegów ŚOR ≥10% na pilotażu vs kontrola, bez straty plonu.');
bullet('Trafność zaleceń agenta ≥90% (panel agronomiczny); halucynacje <2% na otwartym benchmarku.');
bullet('4 publikacje (2 JCR), otwarty benchmark i korpus agro-PL, 300 płacących gospodarstw do M36+12.');

// ── Co zyskuje partner ──
heading('Co zyskuje partner naukowy');
bullet('Finansowanie badań (jednostki naukowe do 100% kosztów) + współautorstwo publikacji i benchmarku.');
bullet('Dostęp do unikalnego zbioru danych: 100 gospodarstw × 2 sezony (satelita + pogoda + decyzje + plon).');
bullet('Realny kanał wdrożenia wyników do praktyki rolniczej (platforma na produkcji, nie prototyp).');

// ── Stopka ──
y = M + 26;
page.drawLine({ start: { x: M, y: y + 14 }, end: { x: M + W, y: y + 14 }, thickness: 0.6, color: LINE });
page.drawText('Kontakt: Infinity Tech · contact@infinityteam.io · demo: agriclaw-tau.vercel.app (konto testowe na życzenie)', {
  x: M, y, size: 9, font: bold, color: INK,
});
page.drawText('Proponowany następny krok: 30-min rozmowa o zakresie WP2/WP3 i liście intencyjnym — do połowy sierpnia 2026.', {
  x: M, y: y - 12, size: 8.5, font: regular, color: MUTED,
});

const bytes = await doc.save();
writeFileSync(OUT, bytes);
console.log('OK:', OUT, Math.round(bytes.length / 1024) + ' kB');
