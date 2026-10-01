// Obraz podglądu linku (Messenger, LinkedIn, e-mail, Slack) — 1200×630.
// Bez niego link do agripol.xyz wysłany jury/rolnikowi był gołym adresem bez karty.
// Styl „stacja naziemna": ciemna zieleń, rampa NDVI jako sygnatura, mono-etykiety.

import { ImageResponse } from 'next/og';
import { ndviRampGradient } from '@/lib/design/ndvi-scale';

export const alt = 'AgriClaw — cyfrowy agronom dla rolnika';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CHIPS = ['Copernicus Sentinel-2', 'Diagnoza ze zdjęcia', 'Tylko legalne ŚOR', 'E-ewidencja 2027'];
const HEADLINE = 'Twój cyfrowy agronom.';
const SUB = 'Satelita nad Twoim polem i konkretna rada po polsku — z uzasadnieniem, w telefonie.';

/**
 * Domyślny font @vercel/og to Noto Sans „latin" — bez gwarancji polskich znaków
 * (ś, ż, Ś…), a jury zobaczyłoby kwadraciki. Ładujemy Space Grotesk (font marki)
 * z Google Fonts, tylko z glifami użytymi na obrazie (`text=`) — kilka kB.
 */
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@${weight}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null; // bez sieci → domyślny font, obraz i tak się wygeneruje
  }
}

export default async function OpengraphImage() {
  const glyphs = ['AgriClaw', 'AGRIPOL.XYZ', HEADLINE, SUB, ...CHIPS].join('');
  const [bold, regular] = await Promise.all([loadFont(700, glyphs), loadFont(400, glyphs)]);
  const fonts = [
    ...(bold ? [{ name: 'Space Grotesk', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(regular ? [{ name: 'Space Grotesk', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f2e1c',
          color: '#f2f7f3',
          padding: '64px 72px',
          fontFamily: fonts.length ? 'Space Grotesk' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            Ag
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>AgriClaw</div>
          <div style={{ marginLeft: 'auto', fontSize: 20, color: '#9fc4ad', letterSpacing: 3 }}>AGRIPOL.XYZ</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>
            {HEADLINE}
          </div>
          <div style={{ width: 560, height: 8, borderRadius: 4, background: ndviRampGradient() }} />
          <div style={{ fontSize: 30, color: '#c9ddd0', maxWidth: 980, lineHeight: 1.3 }}>
            {SUB}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {CHIPS.map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                fontSize: 22,
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid #2f5a40',
                background: '#143a24',
                color: '#e3efe7',
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
