import Link from 'next/link';
import { WifiOff, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Brak połączenia · AgriClaw',
  description: 'AgriClaw działa częściowo offline — ostatnia analiza jest zapisana lokalnie.',
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-emerald-50/40 px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 mb-6">
          <WifiOff className="w-8 h-8 text-emerald-700" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
          Brak połączenia
        </h1>
        <p className="text-gray-600 leading-relaxed mb-8">
          Ostatnia analiza dla Twoich pól zapisana lokalnie. Wróć do dashboardu — pokażemy co mamy w pamięci,
          a reszta pobierze się automatycznie, gdy wróci internet.
        </p>
        <Link
          href="/dashboard"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition"
        >
          Wróć do dashboardu
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </main>
  );
}
