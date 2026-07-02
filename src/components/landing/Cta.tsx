import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function Cta() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Tło: siatka kartograficzna zamiast dekoracyjnych blobów */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-secondary" />
        <div className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow jako odczyt HUD — nie badge ze Sparkles */}
        <div className="inline-flex items-center gap-2.5 border border-border bg-card px-3 py-1.5 rounded-md mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
          <span className="hud-label">Beta · darmowo dla pierwszych 100 rolników</span>
        </div>

        <h2 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6">
          <span className="relative inline-block pb-3">
            Twoje pole. Twój agent. Twój czas.
            {/* Rampa NDVI zamiast gradientu — sygnatura marki */}
            <NdviKeyline className="absolute -bottom-0.5 left-0" height={4} />
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Zobaczysz pierwszą analizę pola w 90 sekund od rejestracji.
          Bez karty, bez kontraktu, bez sprzedawcy.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold text-lg shadow-card hover:brightness-110 transition-all"
          >
            Zacznij bezpłatnie
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-card text-foreground rounded-md font-semibold text-lg border border-border hover:border-foreground/30 transition"
          >
            Mam już konto
          </Link>
        </div>
      </div>
    </section>
  );
}
