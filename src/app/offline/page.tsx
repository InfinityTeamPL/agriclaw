import Link from 'next/link';
import { WifiOff, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Brak połączenia · AgriClaw',
  description: 'AgriClaw działa częściowo offline — ostatnia analiza jest zapisana lokalnie.',
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-card border border-border mb-6">
          <WifiOff className="w-8 h-8 text-signal-healthy" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-3">
          Brak połączenia
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Ostatnia analiza dla Twoich pól zapisana lokalnie. Wróć do dashboardu — pokażemy co mamy w pamięci,
          a reszta pobierze się automatycznie, gdy wróci internet.
        </p>
        <Link
          href="/dashboard"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold shadow-card hover:brightness-110 transition"
        >
          Wróć do dashboardu
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </main>
  );
}
