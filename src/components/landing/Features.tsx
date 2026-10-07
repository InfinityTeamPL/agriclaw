import {
  Camera,
  ShieldCheck,
  BookOpenCheck,
  Scale,
  Timer,
  MessageSquareText,
} from 'lucide-react';
import { Eyebrow, SectionTitle, WRAP } from './ui';

// Każda karta = funkcja, którą da się sprawdzić w demo (bez obietnic na wyrost —
// jury i rolnicy klikają). Kolejność: od problemu rolnika, nie od technologii.
const FEATURES = [
  {
    icon: Camera,
    title: 'Diagnoza ze zdjęcia',
    body: 'Robisz zdjęcie liścia — dostajesz chorobę lub szkodnika, pewność rozpoznania i co z tym zrobić. Gdy model nie jest pewny, mówi to wprost.',
    tone: 'text-signal-disease',
  },
  {
    icon: ShieldCheck,
    title: 'Tylko legalne środki',
    body: 'Każdy polecany środek sprawdzamy w rejestrze ŚOR ministerstwa (dane.gov.pl). Wycofany preparat dostaje czerwoną flagę, zanim trafi do opryskiwacza.',
    tone: 'text-signal-healthy',
  },
  {
    icon: BookOpenCheck,
    title: 'Księga polowa gotowa na 2027',
    body: 'Od 1 stycznia 2027 ewidencja zabiegów ŚOR musi być elektroniczna. Wpis zajmuje pół minuty, PDF dla inspektora IJHARS — jednym kliknięciem.',
    tone: 'text-signal-frost',
  },
  {
    icon: Scale,
    title: 'Kontrola zgodności WPR',
    body: 'Dywersyfikacja (GAEC 7), okrywa zimowa, rotacja. Nie tylko „naruszenie" — mówimy ile hektarów przesunąć, żeby dopłaty były bezpieczne.',
    tone: 'text-signal-heat',
  },
  {
    icon: Timer,
    title: 'Okno oprysku i alerty',
    body: 'Wiatr, deszcz, temperatura i wilgotność godzina po godzinie. Ostrzeżenie o przymrozku, upale i presji chorób liczonej z fazy rozwojowej (BBCH).',
    tone: 'text-signal-drought',
  },
  {
    icon: MessageSquareText,
    title: 'AgroAgent mówi „dlaczego"',
    body: 'Pytasz po polsku „co z polem 3?". Każda rada pokazuje przesłanki i progi, na których się opiera — możesz się nie zgodzić, decyzja zostaje Twoja.',
    tone: 'text-[#d5edb7]',
  },
];

export function Features() {
  return (
    <section id="mozliwosci" className="scroll-mt-24 py-[75px] md:py-[110px]">
      <div className={WRAP}>
        <Eyebrow>Co dostajesz</Eyebrow>
        <SectionTitle>
          Mniej papierów, mniej strat.
          <br />
          <em className="font-[family-name:var(--font-playfair)] font-medium tracking-[-0.055em] text-[#d5edb7]">
            Konkretna rada, kiedy trzeba.
          </em>
        </SectionTitle>

        <div className="mt-10 grid gap-x-3.5 gap-y-10 rounded-[24px] bg-[#182a1c] p-6 sm:grid-cols-2 md:p-[50px] lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="border-t border-current px-2 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] tracking-[0.12em]">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className={`h-6 w-6 ${f.tone}`} aria-hidden="true" />
                </div>
                <b className="mb-2 mt-4 block font-[family-name:var(--font-manrope)] text-xl tracking-[-0.04em]">
                  {f.title}
                </b>
                <p className="max-w-[38ch] text-[15px] leading-[1.55] opacity-70">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
