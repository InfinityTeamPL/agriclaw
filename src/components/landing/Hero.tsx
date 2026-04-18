import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SatelliteScanner } from './SatelliteScanner';

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      {/* ambient bg */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-white to-emerald-50/50" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.1fr_1.2fr] gap-10 lg:gap-16 items-center">
          {/* ────── Lewo: tekst ────── */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-800">
                W fazie testów z pierwszymi rolnikami
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05]">
              Twój cyfrowy
              <br />
              agronom.
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  O krok przed pogodą.
                </span>
                <svg
                  viewBox="0 0 200 12"
                  className="absolute -bottom-1 left-0 w-full h-2"
                  fill="none"
                >
                  <path
                    d="M2 10 Q 50 2 100 6 T 198 10"
                    stroke="currentColor"
                    className="text-emerald-400"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed">
              Obraz z góry + pogoda + historia Twojego pola →
              <span className="text-gray-900 font-medium"> konkretna rada po polsku</span>.
              WhatsApp: „pole 3 pryskaj jutro 5:30". Tyle.
            </p>

            <p className="mt-4 text-base text-gray-500 max-w-xl">
              Dla gospodarstw 20–500 ha. Pszenica, kukurydza, rzepak, burak, ziemniaki — cokolwiek rośnie.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all"
              >
                Załóż konto za darmo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="#jak"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-gray-900 rounded-2xl font-semibold ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm transition"
              >
                Jak to działa
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Gotowe w 60 sekund
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Zero instalacji
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Działa w telefonie
              </div>
            </div>
          </div>

          {/* ────── Prawo: animacja ────── */}
          <div className="relative">
            <SatelliteScanner />
            <div className="absolute -z-10 inset-0 -m-8 bg-gradient-to-br from-emerald-400/30 via-sky-400/20 to-transparent blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
