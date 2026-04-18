'use client';

import {
  Satellite,
  Radar,
  Droplets,
  CloudSun,
  Brain,
  History,
} from 'lucide-react';

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
    title: 'Własny AgroAgent',
    desc: 'Silnik AgroAgent pracuje na Twoich danych i tylko na nich. Rada jest konkretna, nie podręcznikowa.',
  },
  {
    icon: History,
    title: 'Pełna historia pola',
    desc: 'Każde zdjęcie, każda decyzja, każdy oprysk — zapamiętane. Na tym budujemy rekomendacje.',
  },
];

export function DataSources() {
  return (
    <section className="py-20 bg-emerald-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="mb-12 text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-emerald-300 bg-emerald-500/10 rounded-full px-3 py-1 mb-4 ring-1 ring-emerald-400/20">
            Co dostajesz pod maską
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Sześć warstw pracujących razem —
            <br className="hidden sm:block" />
            <span className="text-emerald-300">Ty widzisz tylko gotową odpowiedź.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-2xl bg-white/5 backdrop-blur-sm ring-1 ring-white/10 p-6 hover:bg-white/10 hover:ring-emerald-400/30 transition"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/20 mb-4">
                  <Icon className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="font-bold text-lg mb-2">{s.title}</div>
                <div className="text-sm text-white/70 leading-relaxed">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
