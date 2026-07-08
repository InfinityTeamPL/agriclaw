import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
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

export const metadata: Metadata = {
  title: 'AgriClaw — cyfrowy agronom dla rolnika',
  description:
    'Twój cyfrowy agronom. Skan pola z góry + konkretna rada przez WhatsApp. Po polsku, w telefonie, bez instalacji.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriClaw',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-title" content="AgriClaw" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{ className: 'agri-toast' }} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
