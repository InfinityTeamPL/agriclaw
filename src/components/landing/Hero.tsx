import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SatelliteScanner } from './SatelliteScanner';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      {/* Tło: siatka kartograficzna zamiast dekoracyjnych blobów */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.05fr_1.2fr] gap-10 lg:gap-16 items-center">
          {/* ────── Lewo: tekst ────── */}
          <div>
            {/* Eyebrow jako odczyt HUD — nie badge ze Sparkles */}
            <div className="inline-flex items-center gap-2.5 border border-border bg-card px-3 py-1.5 rounded-md mb-7">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-signal-healthy opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-healthy" />
              </span>
              <span className="hud-label">Faza testów · pierwszych 100 gospodarstw</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.25rem] font-semibold tracking-tight text-foreground leading-[1.02]">
              Twój cyfrowy
              <br />
              agronom.
              <br />
              <span className="relative inline-block pb-3">
                O krok przed pogodą.
                {/* Rampa NDVI zamiast gradient-textu — sygnatura marki */}
                <NdviKeyline className="absolute -bottom-0.5 left-0" height={4} />
              </span>
            </h1>

            <p className="mt-7 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Obraz z góry + pogoda + historia Twojego pola →
              <span className="text-foreground font-medium"> konkretna rada po polsku</span>.
              WhatsApp: „pole 3 — dobre okno na oprysk jutro 5:30". Ty decydujesz.
            </p>

            <p className="mt-4 text-base text-muted-foreground/80 max-w-xl">
              Dla gospodarstw 20–500 ha. Pszenica, kukurydza, rzepak, burak, ziemniaki — cokolwiek rośnie.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-md font-semibold shadow-card hover:brightness-110 transition-all"
              >
                Załóż konto za darmo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="#jak"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-card text-foreground rounded-md font-semibold border border-border hover:border-foreground/30 transition"
              >
                Jak to działa
              </Link>
            </div>

            {/* Metryki jako telemetria — mono, tabular */}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 hud-label">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
                Gotowe w 60 s
              </div>
              <div className="flex items-center gap-2 hud-label">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-frost" />
                Zero instalacji
              </div>
              <div className="flex items-center gap-2 hud-label">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-heat" />
                Działa w telefonie
              </div>
            </div>
          </div>

          {/* ────── Prawo: animacja skanu ────── */}
          <div className="relative">
            <SatelliteScanner />
          </div>
        </div>
      </div>
    </section>
  );
}
