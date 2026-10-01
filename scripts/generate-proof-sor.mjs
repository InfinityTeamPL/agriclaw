// Dowód dla recenzentów (prof. Rutkowski / AGROSTRATEG): zapis RZECZYWISTEJ
// rozmowy z AgroAgentem na danych produkcyjnych (01.10.2026) — walidacja zaleceń względem
// oficjalnego rejestru ŚOR MRiRW w praktyce. Styl: bąbelki czatu + keyline NDVI.
// Uruchomienie: node scripts/generate-proof-sor.mjs
// Wynik: docs/funding/agroagent-rejestr-sor-dowod.pdf

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'docs/funding/agroagent-rejestr-sor-dowod.pdf';
const NDVI_RAMP = ['#7f1d1d', '#dc2626', '#f97316', '#facc15', '#84cc16', '#16a34a', '#14532d'];
const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const INK = rgb(0.09, 0.1, 0.09);
const MUTED = rgb(0.42, 0.44, 0.42);
const GREEN_D = hex('#14532d');
const GREEN = hex('#16a34a');
const CARD = rgb(0.97, 0.98, 0.97);
const BORDER = rgb(0.88, 0.9, 0.88);

// ── Treść: zapis 1:1 z produkcji (skróty […] tylko tam, gdzie oznaczono) ──
const USER_MSG =
  'Myślę o fungicydzie na septoriozę w pszenicy ozimej na wiosnę. Czy Ascra Xpro 260 EC jest legalna i jaka dawka według rejestru? Sąsiad ma jeszcze w magazynie Prosaro 250 EC — mogę go użyć? A Falcon 460 EC?';

const AGENT_PARAS = [
  ['b', 'Ascra Xpro 260 EC — status aktualny, pszenica ozima, septorioza paskowana.'],
  ['n', 'Zakres z etykiety: 1,0–1,5 l/ha (BBCH 30–61). Sprawdź etykietę przed zastosowaniem.'],
  ['b', 'Prosaro 250 EC — WYCOFANY, stosowanie niedozwolone. Nie używaj, nawet z sąsiedzkiego magazynu.'],
  ['b', 'Falcon 460 EC — brak w rejestrze MRiRW. Sprawdź pisownię w wyszukiwarce: gov.pl/web/rolnictwo/wyszukiwarka-srodkow-ochrony-roslin'],
  ['n', 'Zanim zdecydujesz się na zabieg — najpierw potwierdź septoriozę w łanie (zdjęcie liścia zdiagnozuję), potem wybór środka i dawki zweryfikuj z etykietą, pogodą i fazą (BBCH).'],
];

const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);
const regular = await doc.embedFont(readFileSync('C:/Windows/Fonts/arial.ttf'), { subset: true });
const bold = await doc.embedFont(readFileSync('C:/Windows/Fonts/arialbd.ttf'), { subset: true });

const page = doc.addPage([595.28, 841.89]);
const M = 46;
const W = 595.28 - 2 * M;
let y = 841.89;

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

// Keyline NDVI
const segW = 595.28 / NDVI_RAMP.length;
NDVI_RAMP.forEach((c, i) =>
  page.drawRectangle({ x: i * segW, y: 841.89 - 4, width: segW, height: 4, color: hex(c) }),
);
y -= 34;

// Nagłówek
page.drawText('AgriClaw · AgroAgent', { x: M, y, size: 17, font: bold, color: INK });
page.drawText('agripol.xyz', { x: M + W - regular.widthOfTextAtSize('agripol.xyz', 10), y: y + 2, size: 10, font: bold, color: GREEN_D });
y -= 15;
page.drawText('ZAPIS RZECZYWISTEJ ROZMOWY · DANE PRODUKCYJNE · 01.10.2026', {
  x: M, y, size: 7.5, font: bold, color: GREEN_D,
});
y -= 13;
page.drawText('Walidacja zaleceń względem oficjalnego rejestru środków ochrony roślin MRiRW — w czasie rzeczywistym.', {
  x: M, y, size: 9.5, font: regular, color: MUTED,
});
y -= 10;
page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.6, color: BORDER });
y -= 18;

// ── Bąbelek rolnika (prawa strona) ──
{
  const size = 9.5;
  const maxW = W * 0.72;
  const lines = wrap(regular, USER_MSG, size, maxW - 24);
  const h = lines.length * size * 1.4 + 16;
  const bw = Math.min(maxW, Math.max(...lines.map((l) => regular.widthOfTextAtSize(l, size))) + 24);
  const bx = M + W - bw;
  page.drawRectangle({ x: bx, y: y - h, width: bw, height: h, color: GREEN_D, opacity: 0.95 });
  page.drawText('ROLNIK', { x: bx + 12, y: y + 4, size: 6.5, font: bold, color: MUTED });
  let ty = y - 6;
  for (const ln of lines) {
    ty -= size * 1.4;
    page.drawText(ln, { x: bx + 12, y: ty, size, font: regular, color: rgb(1, 1, 1) });
  }
  y -= h + 20;
}

// ── Bąbelek agenta (lewa, z mini-awatarem) ──
{
  const size = 9.5;
  const bx = M + 34;
  const maxW = W * 0.86 - 34;

  // Mini-awatar: satelita nad łanem + rampa
  const ax = M, ay = y - 26, as = 26;
  page.drawRectangle({ x: ax, y: ay, width: as, height: as, color: GREEN_D });
  page.drawCircle({ x: ax + as / 2, y: ay + as * 0.68, size: 2.6, color: rgb(0.97, 0.98, 0.97) });
  page.drawLine({ start: { x: ax + 4, y: ay + as * 0.62 }, end: { x: ax + as - 4, y: ay + as * 0.62 }, thickness: 0.8, color: hex('#a3e635'), opacity: 0.9 });
  NDVI_RAMP.forEach((c, i) =>
    page.drawRectangle({ x: ax + 3 + i * ((as - 6) / NDVI_RAMP.length), y: ay + 3, width: (as - 6) / NDVI_RAMP.length, height: 2, color: hex(c) }),
  );

  // Zawartość
  const paraLines = AGENT_PARAS.map(([style, text]) => ({
    style,
    lines: wrap(style === 'b' ? bold : regular, style === 'n' ? '•  ' + text : text, size, maxW - 24),
  }));
  const contentH = paraLines.reduce((s, p) => s + p.lines.length * size * 1.42 + 5, 0);
  const h = contentH + 18;
  page.drawRectangle({ x: bx, y: y - h, width: maxW, height: h, color: CARD, borderColor: BORDER, borderWidth: 0.8 });
  page.drawText('AGROAGENT · MiniMax-M3 · narzędzie: check_sor_product (rejestr MRiRW, dane.gov.pl)', {
    x: bx + 2, y: y + 4, size: 6.5, font: bold, color: GREEN,
  });
  let ty = y - 8;
  for (const p of paraLines) {
    const f = p.style === 'b' ? bold : regular;
    for (const ln of p.lines) {
      ty -= size * 1.42;
      page.drawText(ln, { x: bx + 12, y: ty, size, font: f, color: INK });
    }
    ty -= 5;
  }
  y -= h + 16;
}

// ── Ramka „co tu widać" ──
{
  const pts = [
    'Dane prawne na żywo: status zezwolenia, dawka, fazy BBCH — z oficjalnego rejestru MRiRW (dane.gov.pl, CC0), nie z pamięci modelu.',
    'Termin zezwolenia liczony na żywo: Prosaro 250 EC był legalny do 15.08.2026 — teraz agent sam wychwycił, że stosowanie jest niedozwolone, choć produkt wciąż figuruje w zastosowaniach dla pszenicy.',
    'Środek nieobecny w rejestrze (Falcon 460 EC) NIE jest zalecany — agent odsyła do wyszukiwarki MRiRW.',
    'Wsparcie decyzji, nie polecenie: najpierw potwierdzenie choroby w łanie, potem decyzja z etykietą, pogodą i fazą BBCH.',
  ];
  const size = 8.5;
  const linesAll = pts.map((p) => wrap(regular, '•  ' + p, size, W - 24));
  const h = linesAll.reduce((s, l) => s + l.length * size * 1.4, 0) + 26;
  page.drawRectangle({ x: M, y: y - h, width: W, height: h, color: rgb(0.94, 0.97, 0.94), borderColor: hex('#86efac'), borderWidth: 0.8 });
  page.drawText('CO POKAZUJE TEN ZAPIS', { x: M + 12, y: y - 14, size: 7, font: bold, color: GREEN_D });
  let ty = y - 18;
  for (const lines of linesAll) {
    for (const ln of lines) {
      ty -= size * 1.4;
      page.drawText(ln, { x: M + 12, y: ty, size, font: regular, color: INK });
    }
  }
  y -= h + 14;
}

// ── Podpis EN ──
page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.6, color: BORDER });
y -= 14;
for (const ln of wrap(
  regular,
  'EN: Verbatim transcript of a real conversation on production data (1 October 2026). The AI agronomist validates every plant-protection recommendation in real time against the official Polish MRiRW register (legal status, dose, BBCH window, label link). Prosaro 250 EC, legal until 15 Aug 2026, is now correctly flagged as withdrawn; a product absent from the register (Falcon 460 EC) is not recommended; the farmer decides.',
  8,
  W,
)) {
  y -= 8 * 1.4;
  page.drawText(ln, { x: M, y, size: 8, font: regular, color: MUTED });
}
y -= 16;
page.drawText('Kontakt: Infinity Tech · contact@infinityteam.io · demo: agripol.xyz', {
  x: M, y, size: 8.5, font: bold, color: INK,
});

const bytes = await doc.save();
writeFileSync(OUT, bytes);
console.log('OK:', OUT, Math.round(bytes.length / 1024) + ' kB');
