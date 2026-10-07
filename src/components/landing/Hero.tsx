import Link from 'next/link';
import { Pill, Arrow, WRAP } from './ui';

// Hero „filmowy": pełnoekranowe zdjęcie pola, wielki nagłówek, telemetria na dole.
// Treść (hasło, opis, CTA, metryki) bez zmian względem poprzedniej wersji.
export function Hero() {
  return (
    <section
      className="relative min-h-[720px] overflow-hidden bg-[#101b13] bg-cover bg-[62%_center] md:min-h-[840px] md:bg-center"
      style={{
        backgroundImage:
          "linear-gradient(90deg,rgba(7,21,12,.9),rgba(7,21,12,.38) 57%,rgba(7,21,12,.08)),url('/landing/agriclaw-hero.webp')",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-transparent to-[#101b13]" />

      <div className={`${WRAP} relative z-10 pt-[112px] md:pt-[150px]`}>
        <div className="max-w-[900px] animate-[rise_.65s_ease_both] motion-reduce:animate-none">
          {/* Link do kampanii Beta 100 */}
          <Link
            href="/beta"
            className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-black/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur transition hover:border-white/50"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b4e46c] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b4e46c]" />
            </span>
            Beta 100 · dołącz do pilotażu →
          </Link>

          <h1 className="mb-7 mt-6 font-[family-name:var(--font-manrope)] text-[clamp(50px,7.4vw,112px)] font-bold leading-[0.96] tracking-[-0.085em]">
            Twój cyfrowy
            <br />
            agronom.
            <br />
            <em className="font-[family-name:var(--font-playfair)] font-medium tracking-[-0.055em] text-[#d5edb7]">
              O krok przed pogodą.
            </em>
          </h1>

          <p className="max-w-[600px] text-lg leading-[1.5] sm:text-xl">
            Zdjęcia satelitarne Copernicus + pogoda + historia Twojego pola →
            <span className="font-semibold text-white"> konkretna rada po polsku</span>:
            „Pole 3 — dobre okno na oprysk jutro 5:30, środek legalny". Ty decydujesz.
          </p>
          <p className="mt-4 max-w-[600px] text-base leading-relaxed opacity-70">
            Dla gospodarstw 20–500 ha. Pszenica, kukurydza, rzepak, burak, ziemniaki — cokolwiek rośnie.
          </p>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
            <Pill href="/signup">
              Załóż konto za darmo <Arrow />
            </Pill>
            <Pill href="#jak" variant="outline">
              Jak to działa ↓
            </Pill>
          </div>

          {/* Zerowy próg wejścia: demo bez rejestracji (auto-login przez ?demo=1) */}
          <Link
            href="/login?demo=1"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#b4e46c] underline-offset-4 hover:underline"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#b4e46c]" />
            Albo zobacz gotowe gospodarstwo demo — bez rejestracji →
          </Link>
        </div>
      </div>

      {/* Telemetria jako pasek indeksu pod hero */}
      <div className="relative z-10 mt-12 pb-8 md:absolute md:inset-x-0 md:bottom-[60px] md:mt-0 md:pb-0">
        <div className={WRAP}>
          <div className="flex flex-col gap-2 border-t border-white/40 pt-[18px] text-[11px] uppercase tracking-[0.15em] sm:flex-row sm:justify-between sm:text-xs">
            <span className="inline-flex items-center gap-2">
              <i className="h-1.5 w-1.5 rounded-full bg-signal-healthy" /> Pierwsza analiza w ~90 s
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="h-1.5 w-1.5 rounded-full bg-signal-frost" /> Zero instalacji
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="h-1.5 w-1.5 rounded-full bg-signal-heat" /> Działa w telefonie i na polu
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
