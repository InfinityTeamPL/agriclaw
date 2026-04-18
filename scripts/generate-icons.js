#!/usr/bin/env node
/* eslint-disable */
// Generator ikon PWA — czysty Node (zlib + Buffer), bez dodatkowych deps.
// Produkuje trzy PNG-i:
//   - public/icons/icon-192.png         (192x192)
//   - public/icons/icon-512.png         (512x512)
//   - public/icons/icon-512-maskable.png (512x512, centrum w safe-zone 80%)
//
// Design: zielone koło z białym listkiem/kiełkiem i drobnym pierścieniem orbity.
// Brak tekstu — prosty logotyp w stylu marki.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// —— PNG encoder ——

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// —— Rasterizer ——

function setPx(buf, w, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= w) return;
  const i = (y * w + x) * 4;
  if (i >= buf.length) return;
  const srcA = a / 255;
  const dstA = buf[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  buf[i] = Math.round((r * srcA + buf[i] * dstA * (1 - srcA)) / outA);
  buf[i + 1] = Math.round((g * srcA + buf[i + 1] * dstA * (1 - srcA)) / outA);
  buf[i + 2] = Math.round((b * srcA + buf[i + 2] * dstA * (1 - srcA)) / outA);
  buf[i + 3] = Math.round(outA * 255);
}

function fillDisc(buf, w, h, cx, cy, radius, color) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius - 1));
  const x1 = Math.min(w - 1, Math.ceil(cx + radius + 1));
  const y0 = Math.max(0, Math.floor(cy - radius - 1));
  const y1 = Math.min(h - 1, Math.ceil(cy + radius + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        setPx(buf, w, x, y, color[0], color[1], color[2], color[3]);
      } else {
        const d = Math.sqrt(d2);
        if (d <= radius + 1) {
          const a = Math.max(0, Math.min(1, radius + 1 - d)) * (color[3] / 255);
          setPx(buf, w, x, y, color[0], color[1], color[2], Math.round(a * 255));
        }
      }
    }
  }
}

function strokeRing(buf, w, h, cx, cy, radius, thickness, color) {
  const rOuter = radius + thickness / 2;
  const rInner = radius - thickness / 2;
  const x0 = Math.max(0, Math.floor(cx - rOuter - 1));
  const x1 = Math.min(w - 1, Math.ceil(cx + rOuter + 1));
  const y0 = Math.max(0, Math.floor(cy - rOuter - 1));
  const y1 = Math.min(h - 1, Math.ceil(cy + rOuter + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= rOuter && d >= rInner) {
        const edgeOut = Math.max(0, Math.min(1, rOuter - d));
        const edgeIn = Math.max(0, Math.min(1, d - rInner));
        const a = Math.min(edgeOut, edgeIn) * (color[3] / 255);
        setPx(buf, w, x, y, color[0], color[1], color[2], Math.round(a * 255));
      }
    }
  }
}

// Stroke „ellipse" wzdłuż łuku, grubość t, z kątem rotacji
function strokeLeaf(buf, w, h, cx, cy, rx, ry, thickness, angleDeg, color) {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const bound = Math.max(rx, ry) + thickness;
  const x0 = Math.max(0, Math.floor(cx - bound));
  const x1 = Math.min(w - 1, Math.ceil(cx + bound));
  const y0 = Math.max(0, Math.floor(cy - bound));
  const y1 = Math.min(h - 1, Math.ceil(cy + bound));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      // rotate
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      // shape: wypełnienie elipsą, w kształcie listka przycinam górną połowę
      const e = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry);
      if (e <= 1 && ly <= 0) {
        setPx(buf, w, x, y, color[0], color[1], color[2], color[3]);
      }
    }
  }
}

function drawStem(buf, w, h, cx, cyBot, cyTop, thickness, color) {
  const half = thickness / 2;
  const x0 = Math.max(0, Math.floor(cx - half - 1));
  const x1 = Math.min(w - 1, Math.ceil(cx + half + 1));
  for (let y = Math.max(0, Math.floor(cyTop)); y <= Math.min(h - 1, Math.ceil(cyBot)); y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = Math.abs(x + 0.5 - cx);
      if (dx <= half) {
        setPx(buf, w, x, y, color[0], color[1], color[2], color[3]);
      } else if (dx <= half + 1) {
        const a = (half + 1 - dx) * (color[3] / 255);
        setPx(buf, w, x, y, color[0], color[1], color[2], Math.round(a * 255));
      }
    }
  }
}

function renderIcon(size, opts = {}) {
  const { maskable = false } = opts;
  const w = size;
  const h = size;
  const buf = Buffer.alloc(w * h * 4, 0);

  const BG_EMERALD = [22, 163, 74, 255]; // #16a34a
  const BG_DEEP = [20, 83, 45, 255]; // #14532d
  const WHITE = [255, 255, 255, 255];
  const WHITE_SOFT = [255, 255, 255, 170];

  if (maskable) {
    // Pełne tło dla maskable — system przytnie.
    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = BG_EMERALD[0];
      buf[i + 1] = BG_EMERALD[1];
      buf[i + 2] = BG_EMERALD[2];
      buf[i + 3] = 255;
    }
  }

  const cx = w / 2;
  const cy = h / 2;
  // Dla maskable zostawiamy 20% padding (safe-zone wynosi ~80% środka).
  const mainR = maskable ? w * 0.36 : w * 0.47;

  // Disc — efekt lekkiego gradientu przez dwa kołka.
  fillDisc(buf, w, h, cx, cy, mainR, BG_DEEP);
  fillDisc(buf, w, h, cx, cy - mainR * 0.06, mainR * 0.985, BG_EMERALD);

  // Orbita dookoła środka
  const ringR = mainR * 0.82;
  const ringT = Math.max(2, w * 0.01);
  strokeRing(buf, w, h, cx, cy, ringR, ringT, WHITE_SOFT);

  // Satelita — biała kropka na orbicie (prawa góra)
  const satAngle = -Math.PI / 4;
  const satX = cx + Math.cos(satAngle) * ringR;
  const satY = cy + Math.sin(satAngle) * ringR;
  fillDisc(buf, w, h, satX, satY, Math.max(3, w * 0.024), WHITE);

  // Kiełek — pionowa łodyga + dwa listki
  const stemThickness = Math.max(2, w * 0.018);
  const stemTop = cy - mainR * 0.42;
  const stemBot = cy + mainR * 0.52;
  drawStem(buf, w, h, cx, stemBot, stemTop, stemThickness, WHITE);

  // Lewy listek
  const leafRx = mainR * 0.30;
  const leafRy = mainR * 0.14;
  strokeLeaf(buf, w, h, cx - mainR * 0.18, cy - mainR * 0.04, leafRx, leafRy, 1, -35, WHITE);
  // Prawy listek
  strokeLeaf(buf, w, h, cx + mainR * 0.18, cy - mainR * 0.22, leafRx, leafRy, 1, 35, WHITE);

  return encodePNG(w, h, buf);
}

function main() {
  const outDir = path.resolve(__dirname, '..', 'public', 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-512-maskable.png', size: 512, maskable: true },
  ];

  for (const t of targets) {
    const buf = renderIcon(t.size, { maskable: t.maskable });
    const p = path.join(outDir, t.name);
    fs.writeFileSync(p, buf);
    console.log(`  wrote ${p} (${buf.length} bytes)`);
  }
}

main();
