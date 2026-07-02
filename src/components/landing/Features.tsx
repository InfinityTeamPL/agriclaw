'use client';

import {
  Wheat,
  CloudRain,
  Brain,
  MessageSquareText,
  WifiOff,
  Settings2,
} from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

const FEATURES = [
  {
    icon: Wheat,
    title: 'Obraz z góry',
    body:
      'Widok pola w 10 m rozdzielczości, odświeżany co kilka dni. Widzisz czy pole jest zdrowe, chore, czy po prostu suche.',
    tone: 'healthy',
  },
  {
    icon: CloudRain,
    title: 'Prognoza parowania',
    body:
      'Nie tylko „ile spadnie deszczu". Liczymy ile wody pole straci jutro i pojutrze, nie tylko ile ma dziś.',
    tone: 'frost',
  },
  {
    icon: Brain,
    title: 'Twój AgroAgent',
    body:
      'Agent pamięta historię Twojego pola przez 2+ sezony. Uczy się Twojego gospodarstwa, nie cudzych.',
    tone: 'disease',
  },
  {
    icon: MessageSquareText,
    title: 'WhatsApp + głos',
    body:
      'Piszesz „co z polem 3?" — agent odpowiada po polsku. Nie ma progu wejścia, nie ma klikania.',
    tone: 'heat',
  },
  {
    icon: WifiOff,
    title: 'Działa offline',
    body:
      'W polu bez zasięgu otwierasz ostatnią analizę. Dane pobierają się z powrotem, gdy wróci internet.',
    tone: 'drought',
  },
  {
    icon: Settings2,
    title: 'Ty decydujesz',
    body:
      'Zmieniasz plan, zatrzymujesz się, eksportujesz dane. Zawsze po Twojej stronie.',
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
            Nie kolejny dashboard.
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
