'use client';

import { MapPin, Satellite, MessageCircle } from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

const STEPS = [
  {
    n: '01',
    icon: MapPin,
    title: 'Zaznacz pole',
    body: 'Wpisujesz adres gospodarstwa, agent pokazuje Ci mapę z góry. Klikasz na swoje pole — granica sama się rysuje.',
  },
  {
    n: '02',
    icon: Satellite,
    title: 'Agent robi robotę',
    body: 'Co 2-3 dni agent sprawdza Twoje pole z góry. Liczy zdrowie roślin, wilgotność gleby, prognozę.',
  },
  {
    n: '03',
    icon: MessageCircle,
    title: 'Dostajesz radę',
    body: 'WhatsApp albo apka: „Pole 3 pryskaj jutro 5:30, okno się zamyka". Konkret, po polsku, bez tabel.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 bg-background">
      {/* Tło: siatka kartograficzna zamiast płaskiej bieli */}
      <div className="absolute inset-0 -z-10 cadastral-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          {/* Eyebrow jako odczyt HUD — nie badge */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
            <span className="hud-label">Jak to działa</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Trzy kroki. Zero
            <br className="hidden sm:block" /> specjalistycznego żargonu.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* linia łącząca kroki — hairline z rampy NDVI jako sygnatura */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-border" />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="group relative rounded-lg bg-card border border-border hover:border-foreground/30 hover:shadow-pop transition-all p-8"
              >
                {/* Górna krawędź karty jako sygnatura marki */}
                <NdviKeyline
                  className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  height={2}
                  rounded={false}
                />
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border border-border transition">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-mono tabular text-2xl font-bold text-muted-foreground/40 group-hover:text-primary transition">
                    {step.n}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
