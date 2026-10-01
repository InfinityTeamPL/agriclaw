// Generuje ikony marki z jednego źródła SVG: favicon (.ico + icon.svg), apple-touch,
// PWA (any + maskable). Uruchom: `npm run gen:icons`. Geometria = components/brand/LogoMark.tsx.
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const mark = (scale = 1) => `
  <g transform="translate(16 16) scale(${scale}) translate(-16 -16) translate(-0.8 1.3)">
    <defs><clipPath id="p"><path d="M7.5 25 L12.5 11.5 H26 L21 25 Z"/></clipPath></defs>
    <g clip-path="url(#p)">
      <rect y="11" width="32" height="5" fill="#facc15"/>
      <rect y="16" width="32" height="4.5" fill="#84cc16"/>
      <rect y="20.5" width="32" height="5" fill="#22c55e"/>
    </g>
    <path d="M6 12.5 Q15 2.5 26 7" fill="none" stroke="#bef264" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="26" cy="7" r="2" fill="#f8fafc"/>
  </g>`;

const svg = ({ rounded = true, scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" ${rounded ? 'rx="7"' : ''} fill="#14532d"/>${mark(scale)}</svg>`;

const png = (s, px) => sharp(Buffer.from(s), { density: 384 }).resize(px, px).png({ compressionLevel: 9 }).toBuffer();

mkdirSync('public/icons', { recursive: true });

// favicon.ico (PNG-in-ICO: 32 + 16 px) — starsze przeglądarki i zakładki
const ico = async () => {
  const sizes = [32, 16];
  const imgs = await Promise.all(sizes.map((n) => png(svg(), n)));
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = imgs.map((img, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(sizes[i], 0); e.writeUInt8(sizes[i], 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.length, 8); e.writeUInt32LE(offset, 12);
    offset += img.length;
    return e;
  });
  return Buffer.concat([head, ...entries, ...imgs]);
};

writeFileSync('src/app/icon.svg', svg());
writeFileSync('src/app/favicon.ico', await ico());
// iOS sam maskuje rogi — pełny kwadrat, znak lekko mniejszy.
writeFileSync('src/app/apple-icon.png', await png(svg({ rounded: false, scale: 0.86 }), 180));
writeFileSync('public/icons/icon-192.png', await png(svg(), 192));
writeFileSync('public/icons/icon-512.png', await png(svg(), 512));
// maskable: pełne tło + znak w „safe zone" (środkowe ~72%)
writeFileSync('public/icons/icon-512-maskable.png', await png(svg({ rounded: false, scale: 0.72 }), 512));
console.log('ikony wygenerowane');
