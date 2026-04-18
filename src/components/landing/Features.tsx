'use client';

import {
  Wheat,
  CloudRain,
  Brain,
  MessageSquareText,
  WifiOff,
  Settings2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Wheat,
    title: 'Obraz z góry',
    body:
      'Widok pola w 10 m rozdzielczości, odświeżany co kilka dni. Widzisz czy pole jest zdrowe, chore, czy po prostu suche.',
    tone: 'emerald',
  },
  {
    icon: CloudRain,
    title: 'Prognoza parowania',
    body:
      'Nie tylko „ile spadnie deszczu". Liczymy ile wody pole straci jutro i pojutrze, nie tylko ile ma dziś.',
    tone: 'sky',
  },
  {
    icon: Brain,
    title: 'Twój agent AI',
    body:
      'Agent pamięta historię Twojego pola przez 2+ sezony. Uczy się Twojego gospodarstwa, nie cudzych.',
    tone: 'violet',
  },
  {
    icon: MessageSquareText,
    title: 'WhatsApp + głos',
    body:
      'Piszesz „co z polem 3?" — agent odpowiada po polsku. Nie ma progu wejścia, nie ma klikania.',
    tone: 'amber',
  },
  {
    icon: WifiOff,
    title: 'Działa offline',
    body:
      'W polu bez zasięgu otwierasz ostatnią analizę. Dane pobierają się z powrotem, gdy wróci internet.',
    tone: 'rose',
  },
  {
    icon: Settings2,
    title: 'Ty decydujesz',
    body:
      'Zmieniasz plan, zatrzymujesz się, eksportujesz dane. Zawsze po Twojej stronie.',
    tone: 'slate',
  },
];

const toneClass: Record<string, { bg: string; ring: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-700' },
  sky: { bg: 'bg-sky-50', ring: 'ring-sky-100', text: 'text-sky-700' },
  violet: { bg: 'bg-violet-50', ring: 'ring-violet-100', text: 'text-violet-700' },
  amber: { bg: 'bg-amber-50', ring: 'ring-amber-100', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', ring: 'ring-rose-100', text: 'text-rose-700' },
  slate: { bg: 'bg-slate-50', ring: 'ring-slate-100', text: 'text-slate-700' },
};

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-emerald-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-16 max-w-2xl">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 mb-4">
            Co dostajesz
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Nie kolejny dashboard.
            <br />
            <span className="text-emerald-600">Konkretna rada, kiedy trzeba.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const tone = toneClass[f.tone];
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-3xl bg-white p-6 ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-lg transition-all"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${tone.bg} ring-1 ${tone.ring} mb-4`}
                >
                  <Icon className={`w-6 h-6 ${tone.text}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
