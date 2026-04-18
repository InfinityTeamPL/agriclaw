import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Cta() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden">
      {/* ornamenty */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl"
        />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-emerald-800/40 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 ring-1 ring-white/25 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium tracking-wide">Beta · darmowo dla pierwszych 100 rolników</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          Twoje pole. Twój agent. Twój czas.
        </h2>
        <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10">
          Zobaczysz pierwszy NDVI w 90 sekund od rejestracji.
          Bez karty, bez kontraktu, bez sprzedawcy.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl font-bold text-lg hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all"
          >
            Zacznij bezpłatnie
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold text-lg hover:bg-white/20 ring-1 ring-white/25 transition"
          >
            Mam już konto
          </Link>
        </div>
      </div>
    </section>
  );
}
