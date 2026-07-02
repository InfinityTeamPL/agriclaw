'use client';

import {
  Satellite,
  Radar,
  Droplets,
  CloudSun,
  Brain,
  History,
} from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

const ITEMS = [
  {
    icon: Satellite,
    title: 'Obraz satelitarny 10 m',
    desc: 'Widok pola z góry co kilka dni. Kolory pokazują gdzie plon rośnie, a gdzie coś go dusi.',
  },
  {
    icon: Radar,
    title: 'Radar przez chmury',
    desc: 'Kiedy niebo jest zasłonięte, przebijamy się inaczej. Nie musisz czekać na dobrą pogodę.',
  },
  {
    icon: Droplets,
    title: 'Wilgotność gleby',
    desc: 'Osobna warstwa dla każdego pola. Wiesz gdzie jest sucho, zanim liście zaczną schnąć.',
  },
  {
    icon: CloudSun,
    title: 'Prognoza + parowanie',
    desc: 'Nie „jutro 22°C", tylko ile wody Twoje pole naprawdę straci — dziś, jutro, za tydzień.',
  },
  {
    icon: Brain,
    title: 'Twój AgroAgent',
    desc: 'Model pracuje na Twoich danych i tylko na nich. Rada jest konkretna, nie podręcznikowa.',
  },
  {
    icon: History,
    title: 'Pełna historia pola',
    desc: 'Każde zdjęcie, każda decyzja, każdy oprysk — zapamiętane. Na tym budujemy rekomendacje.',
  },
];

export function DataSources() {
  return (
    <section className="relative py-20 overflow-hidden bg-secondary">
      {/* Tło: siatka kartograficzna zamiast dekoracyjnego radialnego blobu */}
      <div className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="mb-12 text-center">
          {/* Eyebrow jako odczyt HUD — nie badge z pillem */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
            <span className="hud-label">Co dostajesz pod maską</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Sześć warstw pracujących razem —
            <br className="hidden sm:block" />
            <span className="relative inline-block pb-3 text-foreground">
              Ty widzisz tylko gotową odpowiedź.
              {/* Rampa NDVI jako sygnatura marki, zamiast gradient-textu */}
              <NdviKeyline className="absolute -bottom-0.5 left-0" height={4} />
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-lg bg-card border border-border p-6 shadow-card hover:border-foreground/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-secondary border border-border mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-display font-semibold text-lg tracking-tight text-foreground mb-2">
                  {s.title}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
