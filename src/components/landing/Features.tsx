'use client';

import {
  Camera,
  ShieldCheck,
  BookOpenCheck,
  Scale,
  Timer,
  MessageSquareText,
} from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

// Każda karta = funkcja, którą da się sprawdzić w demo (bez obietnic na wyrost —
// jury i rolnicy klikają). Kolejność: od problemu rolnika, nie od technologii.
const FEATURES = [
  {
    icon: Camera,
    title: 'Diagnoza ze zdjęcia',
    body:
      'Robisz zdjęcie liścia — dostajesz chorobę lub szkodnika, pewność rozpoznania i co z tym zrobić. Gdy model nie jest pewny, mówi to wprost.',
    tone: 'disease',
  },
  {
    icon: ShieldCheck,
    title: 'Tylko legalne środki',
    body:
      'Każdy polecany środek sprawdzamy w rejestrze ŚOR ministerstwa (dane.gov.pl). Wycofany preparat dostaje czerwoną flagę, zanim trafi do opryskiwacza.',
    tone: 'healthy',
  },
  {
    icon: BookOpenCheck,
    title: 'Księga polowa gotowa na 2027',
    body:
      'Od 1 stycznia 2027 ewidencja zabiegów ŚOR musi być elektroniczna. Wpis zajmuje pół minuty, PDF dla inspektora IJHARS — jednym kliknięciem.',
    tone: 'frost',
  },
  {
    icon: Scale,
    title: 'Kontrola zgodności WPR',
    body:
      'Dywersyfikacja (GAEC 7), okrywa zimowa, rotacja. Nie tylko „naruszenie" — mówimy ile hektarów przesunąć, żeby dopłaty były bezpieczne.',
    tone: 'heat',
  },
  {
    icon: Timer,
    title: 'Okno oprysku i alerty',
    body:
      'Wiatr, deszcz, temperatura i wilgotność godzina po godzinie. Ostrzeżenie o przymrozku, upale i presji chorób liczonej z fazy rozwojowej (BBCH).',
    tone: 'drought',
  },
  {
    icon: MessageSquareText,
    title: 'AgroAgent mówi „dlaczego"',
    body:
      'Pytasz po polsku „co z polem 3?". Każda rada pokazuje przesłanki i progi, na których się opiera — możesz się nie zgodzić, decyzja zostaje Twoja.',
    tone: 'foreground',
  },
];

// Sygnały agronomiczne — te same kolory co dane (spójne z rampą NDVI)
const toneClass: Record<string, string> = {
  healthy: 'text-signal-healthy',
  frost: 'text-signal-frost',
  disease: 'text-signal-disease',
  heat: 'text-signal-heat',
  drought: 'text-signal-drought',
  foreground: 'text-foreground',
};

export function Features() {
  return (
    <section className="relative py-24 bg-background">
      {/* Tło: siatka kartograficzna zamiast gradientu */}
      <div className="absolute inset-0 -z-10 cadastral-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
            <span className="hud-label">Co dostajesz</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Mniej papierów, mniej strat.
            <br />
            <span className="relative inline-block pb-2">
              Konkretna rada, kiedy trzeba.
              <NdviKeyline className="absolute -bottom-0.5 left-0" height={4} />
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const tone = toneClass[f.tone];
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-lg bg-card p-6 border border-border hover:border-foreground/25 shadow-card hover:shadow-pop transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-secondary border border-border mb-4">
                  <Icon className={`w-6 h-6 ${tone}`} />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
