// Prezentacja pitch „AGRO-ORBITA" — do rozmów z konsorcjantami (IUNG/SGGW/ODR)
// i jako załącznik wysyłkowy. 9 slajdów PL, styl „stacja naziemna".
// Uruchomienie: node scripts/generate-deck.mjs
// Wynik: docs/wysylka/prezentacja-agro-orbita.pptx

import Pptx from 'pptxgenjs';

const OUT = 'docs/wysylka/prezentacja-agro-orbita.pptx';

// Paleta: głęboka zieleń łanu dominuje, limonka jako akcent (kolory realnej rampy NDVI)
const C = {
  forest: '14532D',
  forestDeep: '0E3B20',
  lime: '84CC16',
  limeSoft: 'A3E635',
  ink: '17251D',
  muted: '5B6B60',
  card: 'F4F7F3',
  border: 'DDE5DD',
  white: 'FFFFFF',
  amber: 'D97706',
  oxide: 'DC2626',
};
const RAMP = ['7F1D1D', 'DC2626', 'F97316', 'FACC15', '84CC16', '16A34A', '14532D'];

const pptx = new Pptx();
pptx.defineLayout({ name: 'W', width: 13.33, height: 7.5 });
pptx.layout = 'W';
const W = 13.33, H = 7.5;

const F = 'Arial';
const MONO = 'Courier New';

// ── Pomocnicze ──
function monoLabel(s, x, y, opts = {}) {
  s.addText(opts.text.toUpperCase(), {
    x, y, w: opts.w ?? 6, h: 0.3,
    fontFace: MONO, fontSize: opts.size ?? 10, bold: true, charSpacing: 2,
    color: opts.color ?? C.lime, align: opts.align ?? 'left',
  });
}
// Rampa NDVI jako LEGENDA z podpisami (element merytoryczny, nie dekoracja)
function ndviLegend(s, x, y, w) {
  const seg = w / RAMP.length;
  RAMP.forEach((c, i) => s.addShape('rect', { x: x + i * seg, y, w: seg, h: 0.12, fill: { color: c } }));
  s.addText('0.0', { x: x - 0.05, y: y + 0.12, w: 0.5, h: 0.22, fontFace: MONO, fontSize: 8, color: C.muted });
  s.addText('NDVI', { x: x + w / 2 - 0.4, y: y + 0.12, w: 0.8, h: 0.22, fontFace: MONO, fontSize: 8, color: C.muted, align: 'center' });
  s.addText('1.0', { x: x + w - 0.45, y: y + 0.12, w: 0.5, h: 0.22, fontFace: MONO, fontSize: 8, color: C.muted, align: 'right' });
}
function iconCircle(s, x, y, glyph, bg = C.forest, fg = C.white, d = 0.52) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: bg } });
  s.addText(glyph, { x: x - 0.08, y: y - 0.02, w: d + 0.16, h: d, fontSize: 16, color: fg, align: 'center', valign: 'middle', bold: true, fontFace: F });
}

// ════════ SLAJD 1 — tytułowy (ciemny) ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.forestDeep };
  // satelita: orbit + korpus (kształty)
  s.addShape('arc', { x: 8.6, y: 0.9, w: 4.0, h: 3.2, angleRange: [200, 340], line: { color: C.limeSoft, width: 1.25, dashType: 'dash' } });
  s.addShape('roundRect', { x: 10.35, y: 1.28, w: 0.5, h: 0.34, rectRadius: 0.05, fill: { color: C.white } });
  s.addShape('rect', { x: 9.95, y: 1.36, w: 0.34, h: 0.18, fill: { color: C.limeSoft } });
  s.addShape('rect', { x: 10.91, y: 1.36, w: 0.34, h: 0.18, fill: { color: C.limeSoft } });
  s.addShape('triangle', { x: 10.28, y: 1.66, w: 0.64, h: 1.5, flipV: false, fill: { color: C.lime, transparency: 82 } });
  // siatka pola (mini, kolory rampy)
  const cols = 7, rows = 3, gx = 8.75, gy = 3.3, cw = 0.52, ch = 0.34, gap = 0.06;
  const rng = (i, j) => RAMP[Math.min(6, Math.max(2, (i * 3 + j * 5) % 7))];
  for (let r = 0; r < rows; r++) for (let c2 = 0; c2 < cols; c2++)
    s.addShape('rect', { x: gx + c2 * (cw + gap), y: gy + r * (ch + gap), w: cw, h: ch, fill: { color: rng(r, c2) } });

  monoLabel(s, 0.8, 0.85, { text: 'NCBR AGROSTRATEG I · Obszar T3 Rolnictwo cyfrowe' });
  s.addText('AGRO-ORBITA', { x: 0.75, y: 1.25, w: 8, h: 1.15, fontFace: F, fontSize: 54, bold: true, color: C.white });
  s.addText('Cyfrowy agronom AI dla gospodarstw 10–200 ha —\nteledetekcja Sentinel-1/2 + rozmowa po polsku przez WhatsApp.', {
    x: 0.8, y: 2.5, w: 7.3, h: 1.2, fontFace: F, fontSize: 19, color: 'E7F0E7', lineSpacing: 26,
  });
  s.addText([
    { text: 'Propozycja konsorcjum badawczego\n', options: { fontSize: 14, color: C.limeSoft, bold: true } },
    { text: 'AgriClaw (Infinity Tech) · IUNG-PIB · SGGW/Politechnika · ODR', options: { fontSize: 13, color: 'CFE0CF' } },
  ], { x: 0.8, y: 4.15, w: 7.3, h: 0.85 });
  // pasek faktów na dole
  const facts = [
    ['NABÓR DO', '28.08.2026'],
    ['BUDŻET KONKURSU', '300 mln zł'],
    ['PROJEKT', '9,4 mln zł / 36 mies.'],
    ['PRODUKT DZIAŁA', 'agripol.xyz'],
  ];
  facts.forEach(([k, v], i) => {
    const x = 0.8 + i * 3.02;
    s.addText(k, { x, y: 6.1, w: 2.9, h: 0.3, fontFace: MONO, fontSize: 9, color: '9DB8A0', charSpacing: 2 });
    s.addText(v, { x, y: 6.4, w: 2.9, h: 0.42, fontFace: F, fontSize: 17, bold: true, color: i === 0 ? C.limeSoft : C.white });
  });
}

// ════════ SLAJD 2 — problem ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Problem', color: C.forest });
  s.addText('Satelity są nad każdym polem.\nRolnik nie ma z nich nic.', { x: 0.75, y: 0.9, w: 8.5, h: 1.5, fontFace: F, fontSize: 34, bold: true, color: C.ink, lineSpacing: 40 });
  const stats = [
    ['83%', 'firm agrotech wskazuje deficyt kompetencji cyfrowych rolników jako główną barierę (Rolnictwo Zrównoważone, 2025)'],
    ['1,31 mln', 'gospodarstw w Polsce (2. miejsce w UE), średnio ~11 ha — poza zasięgiem narzędzi „dla dużych"'],
    ['0', 'platform w PL z agentem AI po polsku — SatAgro/Cropwise/eAgronom dają mapy, nie odpowiedzi'],
  ];
  stats.forEach(([n, d], i) => {
    const x = 0.8 + i * 4.0;
    s.addShape('roundRect', { x, y: 2.85, w: 3.75, h: 3.1, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.border, width: 1 } });
    s.addText(n, { x: x + 0.25, y: 3.1, w: 3.25, h: 1.0, fontFace: F, fontSize: 48, bold: true, color: C.forest });
    s.addText(d, { x: x + 0.25, y: 4.15, w: 3.25, h: 1.6, fontFace: F, fontSize: 13.5, color: C.muted, lineSpacing: 18 });
  });
  s.addText('Istniejące narzędzia teledetekcyjne pokazują MAPĘ. Rolnik potrzebuje DECYZJI: „co mam zrobić na polu 3 — i czy to legalne?"', {
    x: 0.8, y: 6.35, w: 11.7, h: 0.7, fontFace: F, fontSize: 15, italic: true, color: C.ink,
  });
}

// ════════ SLAJD 3 — rozwiązanie (flow) ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Rozwiązanie', color: C.forest });
  s.addText('Odwracamy interfejs: zamiast panelu z mapami — rozmowa.', { x: 0.75, y: 0.9, w: 11.8, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });

  const steps = [
    ['🛰', 'DANE', 'Sentinel-1 (radar, widzi przez chmury) + Sentinel-2 (NDVI z maską chmur) + pogoda + historia pola'],
    ['⚙', 'MODELE PL', 'BBCH/GDD, bilans wodny, presja chorób, plan azotowy — kalibrowane do Polski (rola IUNG-PIB)'],
    ['✓', 'GUARDRAIL', 'Każdy środek walidowany w oficjalnym rejestrze ŚOR MRiRW: status prawny, dawka, fazy, etykieta'],
    ['💬', 'ROLNIK', 'Konkretna rada po polsku na WhatsApp — jako wsparcie decyzji. Ostatnie słowo ma rolnik'],
  ];
  steps.forEach(([g, t, d], i) => {
    const x = 0.8 + i * 3.13;
    s.addShape('roundRect', { x, y: 2.3, w: 2.85, h: 3.35, rectRadius: 0.08, fill: { color: i === 2 ? C.forest : C.card }, line: { color: i === 2 ? C.forest : C.border, width: 1 } });
    iconCircle(s, x + 0.25, y3(), g, i === 2 ? C.lime : C.forest, i === 2 ? C.forestDeep : C.white);
    function y3() { return 2.6; }
    s.addText(t, { x: x + 0.25, y: 3.3, w: 2.4, h: 0.4, fontFace: MONO, fontSize: 12, bold: true, charSpacing: 2, color: i === 2 ? C.limeSoft : C.forest });
    s.addText(d, { x: x + 0.25, y: 3.75, w: 2.4, h: 1.75, fontFace: F, fontSize: 12.5, color: i === 2 ? 'E7F0E7' : C.muted, lineSpacing: 16.5 });
    if (i < 3) s.addText('→', { x: x + 2.82, y: 3.7, w: 0.4, h: 0.5, fontSize: 22, color: C.muted, align: 'center' });
  });

  s.addShape('roundRect', { x: 0.8, y: 6.0, w: 11.75, h: 0.95, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.border, width: 1 } });
  s.addText([
    { text: 'WhatsApp: ', options: { bold: true, color: C.forest } },
    { text: '„Pole 3 (pszenica): NDVI 0,42, spadek 0,16. Jeśli zdecydujesz się na oprysk — dobre okno jutro 5:30–9:00. Dawkę potwierdź z etykietą."', options: { italic: true, color: C.ink } },
  ], { x: 1.05, y: 6.15, w: 11.3, h: 0.65, fontFace: F, fontSize: 14 });
}

// ════════ SLAJD 4 — to już działa (TRL6) ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Punkt startu — nie prototyp', color: C.forest });
  s.addText('To już działa na produkcji (TRL 6)', { x: 0.75, y: 0.9, w: 9.5, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
  s.addText('agripol.xyz', { x: 10.4, y: 1.02, w: 2.1, h: 0.45, fontFace: MONO, fontSize: 15, bold: true, color: C.lime, align: 'right' });

  const tiles = [
    ['Teledetekcja pełna', 'NDVI/NDRE/NDWI/SAVI z maską chmur SCL + radar S1 + Planet 3 m'],
    ['Rejestr ŚOR MRiRW — LIVE', 'walidacja legalności środków w czasie rzeczywistym (szczegóły →)'],
    ['Agent AI po polsku', 'czat + WhatsApp, 2 wymienne silniki, ~0,01 zł/rozmowę'],
    ['Diagnoza ze zdjęcia', 'telefon → prawdopodobna diagnoza + co sprawdzić dalej'],
    ['E-księga + zgodność', 'rejestr zabiegów pod kontrolę IJHARS/ARiMR, GAEC, eksporty'],
    ['Pilotaż „Beta 100"', 'nabór 100 gospodarstw trwa — piloci = walidacja WP5'],
  ];
  tiles.forEach(([t, d], i) => {
    const x = 0.8 + (i % 3) * 4.0, y = 1.95 + Math.floor(i / 3) * 2.3;
    const hot = i === 1;
    s.addShape('roundRect', { x, y, w: 3.75, h: 2.05, rectRadius: 0.08, fill: { color: hot ? C.forest : C.card }, line: { color: hot ? C.forest : C.border, width: 1 } });
    s.addText(t, { x: x + 0.22, y: y + 0.18, w: 3.3, h: 0.6, fontFace: F, fontSize: 15.5, bold: true, color: hot ? C.limeSoft : C.forest });
    s.addText(d, { x: x + 0.22, y: y + 0.8, w: 3.3, h: 1.1, fontFace: F, fontSize: 12.5, color: hot ? 'E7F0E7' : C.muted, lineSpacing: 16.5 });
  });
  s.addText('20+ wdrożeń w 3 miesiące · testy automatyczne 123/123 · framing „wsparcie decyzji" po recenzji eksperta akademickiego (07.2026)', {
    x: 0.8, y: 6.6, w: 11.7, h: 0.5, fontFace: F, fontSize: 12.5, color: C.muted, italic: true,
  });
}

// ════════ SLAJD 5 — guardrail ŚOR (gwiazda) ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Unikat: zgodność z prawem wbudowana w AI', color: C.forest });
  s.addText('Każde zalecenie sprawdzone w rejestrze ŚOR MRiRW', { x: 0.75, y: 0.9, w: 11.8, h: 0.7, fontFace: F, fontSize: 28, bold: true, color: C.ink });

  const rows = [
    ['2 983', 'produkty w imporcie z dane.gov.pl (CC0), odświeżane automatycznie co wydanie'],
    ['18 444', 'zastosowań: uprawa × agrofag × dawka × fazy BBCH — cytowane z rejestru, nie z pamięci AI'],
    ['61', 'środków „wycofany" wykrywanych na starcie — agent ich NIE zaleci'],
  ];
  rows.forEach(([n, d], i) => {
    const y = 1.85 + i * 1.05;
    s.addText(n, { x: 0.8, y, w: 1.7, h: 0.8, fontFace: F, fontSize: 32, bold: true, color: C.forest });
    s.addText(d, { x: 2.6, y: y + 0.12, w: 4.6, h: 0.85, fontFace: F, fontSize: 13, color: C.muted, lineSpacing: 16 });
  });
  s.addText('Karencja i pełne warunki: zawsze odesłanie do etykiety (jedyne wiążące źródło) — agent nie zgaduje.', {
    x: 0.8, y: 5.15, w: 6.3, h: 0.8, fontFace: F, fontSize: 13, italic: true, color: C.ink,
  });
  ndviLegend(s, 0.8, 6.35, 5.6);

  // karta „zapis z produkcji"
  s.addShape('roundRect', { x: 7.5, y: 1.8, w: 5.05, h: 5.15, rectRadius: 0.1, fill: { color: C.forestDeep } });
  s.addText('ZAPIS ROZMOWY · 01.10.2026', { x: 7.75, y: 2.0, w: 4.6, h: 0.3, fontFace: MONO, fontSize: 9.5, bold: true, color: C.limeSoft, charSpacing: 2 });
  s.addShape('roundRect', { x: 7.75, y: 2.4, w: 4.55, h: 0.85, rectRadius: 0.07, fill: { color: C.forest } });
  s.addText('„Ascra Xpro 260 EC na septoriozę — legalna? Sąsiad ma Prosaro 250 EC. A Falcon 460 EC?"', { x: 7.92, y: 2.47, w: 4.25, h: 0.75, fontFace: F, fontSize: 11.5, italic: true, color: C.white });
  // Kolor tylko na glifie statusu; treść niemal biała — pewny kontrast na ciemnym tle.
  const lines = [
    [['✓ ', C.limeSoft], ['Ascra Xpro 260 EC — aktualny, pszenica', 'F8FAFC'], true],
    [['  ', 'CFE0CF'], ['dawka z rejestru: 1,0–1,5 l/ha · BBCH 30–61', 'CFE0CF'], false],
    [['✗ ', 'F87171'], ['Prosaro 250 EC — WYCOFANY (od 16.08)', 'F8FAFC'], true],
    [['  → ', 'F87171'], ['nie używaj, nawet z zapasu', 'F8FAFC'], true],
    [['✗ ', 'F87171'], ['Falcon 460 EC — brak w rejestrze', 'F8FAFC'], true],
    [['⚠ ', 'FBBF24'], ['Najpierw potwierdź chorobę w łanie', 'F8FAFC'], false],
  ];
  lines.forEach(([g, t, b], i) =>
    s.addText(
      [
        { text: g[0], options: { color: g[1], bold: true } },
        { text: t[0], options: { color: t[1], bold: Boolean(b) } },
      ],
      { x: 7.85, y: 3.42 + i * 0.4, w: 4.55, h: 0.38, fontFace: MONO, fontSize: 10.5 },
    ),
  );
  s.addText('AI, które wie, czego NIE wolno doradzić.', { x: 7.75, y: 5.9, w: 4.6, h: 0.5, fontFace: F, fontSize: 14, bold: true, color: C.white, italic: true });
}

// ════════ SLAJD 6 — projekt badawczy ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Projekt badawczy · TRL 6 → 9', color: C.forest });
  s.addText('Trzy filary badań + walidacja polowa', { x: 0.75, y: 0.9, w: 11.8, h: 0.65, fontFace: F, fontSize: 30, bold: true, color: C.ink });

  const wps = [
    ['WP2 · Agent odporny na halucynacje', 'Korpus agro-PL + RAG na rejestrze ŚOR i etykietach + „AgroHalu-PL" — PIERWSZY otwarty benchmark halucynacji agronomicznych PL. Cel: <2% halucynacji.', 'SGGW / Politechnika'],
    ['WP3 · Predykcja chorób dla PL', 'Modele septorioza/fuzarioza/zaraza na Sentinel+meteo+BBCH, retrospektywna walidacja 10 lat. Cel: AUC > 0,8.', 'IUNG-PIB'],
    ['WP5 · Walidacja polowa', '100 gospodarstw, 4 województwa, 2 sezony, protokół z grupą kontrolną: plon, zużycie N/ŚOR, decyzje, NPS.', 'ODR + AgriClaw'],
  ];
  wps.forEach(([t, d, who], i) => {
    const y = 1.8 + i * 1.5;
    s.addShape('roundRect', { x: 0.8, y, w: 11.75, h: 1.32, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.border, width: 1 } });
    s.addText(t, { x: 1.05, y: y + 0.12, w: 4.3, h: 1.1, fontFace: F, fontSize: 15.5, bold: true, color: C.forest, valign: 'top' });
    s.addText(d, { x: 5.45, y: y + 0.12, w: 5.4, h: 1.12, fontFace: F, fontSize: 11.5, color: C.muted, lineSpacing: 14.5, valign: 'top' });
    s.addText(who, { x: 10.95, y: y + 0.12, w: 1.5, h: 1.1, fontFace: MONO, fontSize: 10, bold: true, color: C.ink, valign: 'top' });
  });
  // kamienie milowe (krótkie etykiety = bez zawijania; oś mieści się z marginesem)
  const ms = ['M6 benchmark v1', 'M12 agent v2', 'M18 AUC>0,8', 'M24 100 gospodarstw', 'M36 komercjalizacja'];
  s.addShape('line', { x: 1.3, y: 6.75, w: 10.4, h: 0, line: { color: C.border, width: 1.5 } });
  ms.forEach((m, i) => {
    const x = 1.3 + i * 2.6;
    s.addShape('ellipse', { x: x - 0.06, y: 6.69, w: 0.13, h: 0.13, fill: { color: C.forest } });
    s.addText(m, { x: x - 1.05, y: 6.32, w: 2.1, h: 0.32, fontFace: MONO, fontSize: 9.5, color: C.ink, align: 'center' });
  });
}

// ════════ SLAJD 7 — konsorcjum + budżet ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Konsorcjum · 9,4 mln zł / 36 miesięcy', color: C.forest });
  s.addText('Każdy partner wnosi to, czego pozostałym brakuje', { x: 0.75, y: 0.9, w: 11.8, h: 0.65, fontFace: F, fontSize: 29, bold: true, color: C.ink });

  const rows = [
    ['AgriClaw (Infinity Tech)', 'LIDER · przedsiębiorca', 'platforma, agent AI, komercjalizacja', 45],
    ['IUNG-PIB Puławy', 'instytut', 'modele agronomiczne, kalibracja PL, dane suszowe', 28],
    ['SGGW / Politechnika Pozn.', 'uczelnia', 'badania NLP/LLM, benchmark, publikacje', 15],
    ['ODR wojewódzki', 'doradztwo', 'rekrutacja 100 gospodarstw, walidacja, szkolenia', 12],
  ];
  rows.forEach(([n, role, d, pct], i) => {
    const y = 1.85 + i * 1.02;
    s.addShape('roundRect', { x: 0.8, y, w: 11.75, h: 0.88, rectRadius: 0.07, fill: { color: i === 0 ? C.forest : C.card }, line: { color: i === 0 ? C.forest : C.border, width: 1 } });
    s.addText(n, { x: 1.05, y: y + 0.09, w: 3.6, h: 0.4, fontFace: F, fontSize: 14.5, bold: true, color: i === 0 ? C.white : C.ink });
    s.addText(role, { x: 1.05, y: y + 0.47, w: 3.6, h: 0.3, fontFace: MONO, fontSize: 9, color: i === 0 ? C.limeSoft : C.muted, charSpacing: 1 });
    s.addText(d, { x: 4.8, y: y + 0.09, w: 5.2, h: 0.72, fontFace: F, fontSize: 11.5, color: i === 0 ? 'E7F0E7' : C.muted, valign: 'middle' });
    // pasek udziału (dane, nie dekoracja) — skala tak, by "45%" mieściło się w karcie
    const bw = 1.4 * (pct / 45);
    s.addShape('rect', { x: 10.05, y: y + 0.3, w: bw, h: 0.28, fill: { color: i === 0 ? C.lime : C.forest } });
    s.addText(`${pct}%`, { x: 10.05 + bw + 0.08, y: y + 0.22, w: 0.75, h: 0.42, fontFace: MONO, fontSize: 13, bold: true, color: i === 0 ? C.white : C.ink });
  });

  s.addShape('roundRect', { x: 0.8, y: 6.15, w: 11.75, h: 0.85, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.border, width: 1 } });
  s.addText([
    { text: 'Warunki naboru (gov.pl/ncbr, potwierdzone): ', options: { bold: true, color: C.forest } },
    { text: 'budżet 300 mln zł · projekt 1–25 mln zł · konsorcjum max 5 podmiotów (≥1 firma + ≥1 org. badawcza) · nabór do 28.08.2026, 16:00', options: { color: C.ink } },
  ], { x: 1.05, y: 6.3, w: 11.3, h: 0.55, fontFace: F, fontSize: 13 });
}

// ════════ SLAJD 8 — wskaźniki ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.white };
  monoLabel(s, 0.8, 0.55, { text: 'Zobowiązania mierzalne', color: C.forest });
  s.addText('Co obiecujemy — i jak to zmierzymy', { x: 0.75, y: 0.9, w: 11.8, h: 0.65, fontFace: F, fontSize: 30, bold: true, color: C.ink });

  const kpis = [
    ['100', 'gospodarstw pilotażowych, ≥5 000 ha, 2 sezony, grupa kontrolna'],
    ['−8% N', 'zużycia azotu na pilotażu vs kontrola — bez straty plonu'],
    ['−10% ŚOR', 'zabiegów ochrony roślin — mniej chemii, ta sama produkcja'],
    ['<2%', 'halucynacji agenta na OTWARTYM benchmarku AgroHalu-PL'],
    ['4 publikacje', 'w tym 2 JCR + otwarty korpus i benchmark (open science)'],
    ['300', 'płacących gospodarstw w 12 mies. po projekcie (99–149 zł/mies.)'],
  ];
  kpis.forEach(([n, d], i) => {
    const x = 0.8 + (i % 3) * 4.0, y = 1.95 + Math.floor(i / 3) * 2.35;
    s.addShape('roundRect', { x, y, w: 3.75, h: 2.1, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.border, width: 1 } });
    s.addText(n, { x: x + 0.22, y: y + 0.15, w: 3.3, h: 0.85, fontFace: F, fontSize: 34, bold: true, color: C.forest });
    s.addText(d, { x: x + 0.22, y: y + 1.0, w: 3.3, h: 1.0, fontFace: F, fontSize: 12.5, color: C.muted, lineSpacing: 16 });
  });
  s.addText('Wpisane w cele: Zielony Ład (redukcja ŚOR/N), Program azotanowy, ekoschematy WPR.', {
    x: 0.8, y: 6.65, w: 11.7, h: 0.45, fontFace: F, fontSize: 12.5, italic: true, color: C.muted,
  });
}

// ════════ SLAJD 9 — dla partnera + CTA (ciemny) ════════
{
  const s = pptx.addSlide();
  s.background = { color: C.forestDeep };
  monoLabel(s, 0.8, 0.6, { text: 'Zaproszenie do konsorcjum' });
  s.addText('Co zyskuje partner naukowy', { x: 0.75, y: 0.95, w: 11.8, h: 0.7, fontFace: F, fontSize: 32, bold: true, color: C.white });

  const gains = [
    ['Finansowanie 100%', 'jednostki naukowe — pełne pokrycie kosztów badań + współautorstwo publikacji i benchmarku'],
    ['Unikalny zbiór danych', '100 gospodarstw × 2 sezony: satelita + pogoda + decyzje rolnika + plon — nikt w PL tego nie ma'],
    ['Realne wdrożenie', 'wyniki trafiają do działającej platformy z użytkownikami, nie do szuflady'],
  ];
  gains.forEach(([t, d], i) => {
    const x = 0.8 + i * 4.0;
    s.addShape('roundRect', { x, y: 1.95, w: 3.75, h: 2.5, rectRadius: 0.08, fill: { color: C.forest } });
    s.addText(t, { x: x + 0.22, y: 2.15, w: 3.3, h: 0.65, fontFace: F, fontSize: 17, bold: true, color: C.limeSoft });
    s.addText(d, { x: x + 0.22, y: 2.85, w: 3.3, h: 1.45, fontFace: F, fontSize: 12.5, color: 'E7F0E7', lineSpacing: 17 });
  });

  s.addText('Następny krok: 30 minut rozmowy o zakresie WP2/WP3.', { x: 0.8, y: 4.95, w: 11.7, h: 0.55, fontFace: F, fontSize: 21, bold: true, color: C.white });
  s.addText('List intencyjny do ~15.08 → wniosek do 28.08.2026.', { x: 0.8, y: 5.5, w: 11.7, h: 0.5, fontFace: F, fontSize: 16, color: C.limeSoft });
  s.addText('contact@infinityteam.io   ·   demo na żywo: agripol.xyz (konto testowe na życzenie)   ·   załączniki: one-pager + zapis rozmowy agenta', {
    x: 0.8, y: 6.55, w: 11.7, h: 0.5, fontFace: MONO, fontSize: 11.5, color: '9DB8A0',
  });
}

await pptx.writeFile({ fileName: OUT });
console.log('OK:', OUT);
