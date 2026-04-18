'use client';

import { MapPin, Satellite, MessageCircle } from 'lucide-react';

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
    <section className="relative py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 mb-4">
            Jak to działa
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Trzy kroki. Zero
            <br className="hidden sm:block" /> specjalistycznego żargonu.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* linia łącząca kroki */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="relative rounded-3xl bg-white ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-xl transition-all p-8 group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 group-hover:bg-emerald-100 transition">
                    <Icon className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className="text-2xl font-mono font-bold text-gray-300 group-hover:text-emerald-300 transition">
                    {step.n}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
