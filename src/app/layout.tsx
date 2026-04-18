import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgriClaw — AI dla rolników',
  description:
    'Agent AI + satelity (NDVI, wilgotność gleby, pogoda) → konkretna rada kiedy pryskać, nawozić, zbierać. Po polsku, przez WhatsApp.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriClaw',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
