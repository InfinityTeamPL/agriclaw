import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { SITE_URL } from '@/lib/site';
import './globals.css';

// Typografia AgriClaw — trzy role:
//  display  Space Grotesk — geometryczny grotesk, „techniczny", pełne PL znaki
//  body     IBM Plex Sans — jedna rodzina z Plex Mono (rodowód instrumentacyjny),
//           czytelny na telefonie w słońcu; celowo NIE Inter (sygnatura generyków)
//  mono     IBM Plex Mono — TELEMETRIA: NDVI, ha, współrzędne, daty (tabular-nums)
const display = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});
const body = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const DESCRIPTION =
  'Twój cyfrowy agronom: satelita Copernicus nad polem, diagnoza ze zdjęcia, tylko legalne środki ochrony i księga polowa gotowa na e-ewidencję 2027. Po polsku, w telefonie, bez instalacji.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'AgriClaw — cyfrowy agronom dla rolnika',
  description: DESCRIPTION,
  // Karta podglądu linku (obraz: app/opengraph-image.tsx).
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'AgriClaw',
    title: 'AgriClaw — cyfrowy agronom dla rolnika',
    description: DESCRIPTION,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: 'AgriClaw — cyfrowy agronom dla rolnika', description: DESCRIPTION },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriClaw',
  },
  // Ikony: konwencja plików — app/icon.svg, app/favicon.ico, app/apple-icon.png
  // (generuje scripts/gen-icons.mjs). Ręczny `icons.apple` przykrywał 180 px ikoną 192 px.
};

export const viewport: Viewport = {
  themeColor: '#14532d',
  width: 'device-width',
  initialScale: 1,
  // Bez tego env(safe-area-inset-bottom) = 0 i dolny pasek chowa się pod belką iPhone'a.
  viewportFit: 'cover',
  // NIE blokujemy powiększania (usunięto maximumScale:1) — WCAG 1.4.4. Rolnik
  // w słońcu / w rękawicach / starszy musi móc powiększyć drobny tekst i zdjęcia.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="AgriClaw" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{ className: 'agri-toast' }} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
