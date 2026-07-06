// Landing kampanii „Beta 100" — rekrutacja pierwszych 100 gospodarstw pilotażowych.
// Cel potrójny: walidacja produktu, listy intencyjne pod wniosek AGROSTRATEG,
// trakcja przed rundą. Brief: docs/marketing/kampania-beta-2026.md.

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Satellite,
  MessageSquare,
  Camera,
  BookOpen,
  ShieldCheck,
  Handshake,
  ClipboardCheck,
  MapPin,
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export const metadata: Metadata = {
  title: 'Beta 100 — darmowy pilotaż AgriClaw dla 100 gospodarstw',
  description:
    'Dołącz do pierwszych 100 gospodarstw testujących cyfrowego agronoma: satelitarny monitoring pól, rada po polsku na WhatsApp i e-księga zabiegów. Za darmo do końca 2026.',
};

const GIVES = [
  {
    icon: Satellite,
    title: 'Pełny monitoring satelitarny',
    desc: 'NDVI/NDRE co 2-3 dni (Sentinel-2 z maską chmur), radar Sentinel-1 gdy chmury, zdjęcia Planet 3 m.',
  },
  {
    icon: MessageSquare,
    title: 'Agent AI po polsku',
    desc: 'Pytasz jak sąsiada-agronoma — na WhatsApp albo w aplikacji. Odpowiedź wspiera Twoją decyzję, nie zastępuje jej.',
  },
  {
    icon: Camera,
    title: 'Diagnoza ze zdjęcia',
    desc: 'Fotografujesz liść z telefonu, dostajesz najbardziej prawdopodobną diagnozę i co sprawdzić dalej.',
  },
  {
    icon: BookOpen,
    title: 'E-księga zabiegów + zgodność',
    desc: 'Rejestr zabiegów gotowy na kontrolę (IJHARS/ARiMR), eksport PDF/CSV, sprawdzenie GAEC jednym rzutem oka.',
  },
];

const ASKS = [
  {
    icon: ClipboardCheck,
    title: '15 minut feedbacku miesięcznie',
    desc: 'Krótka rozmowa albo ankieta: co działa, co przeszkadza, czego brakuje. To Ty kształtujesz produkt.',
  },
  {
    icon: Handshake,
    title: 'Opcjonalnie: list intencyjny',
    desc: 'Jeśli produkt Ci pomaga — podpisany list wesprze nasz wniosek badawczy (NCBR). Zero zobowiązań finansowych.',
  },
];

const STEPS = [
  { n: '01', title: 'Załóż konto', desc: '60 sekund, bez karty. Konto zostaje darmowe do 31.12.2026.' },
  { n: '02', title: 'Dodaj pole', desc: 'Narysuj granicę na mapie albo zaimportuj działkę po numerze ewidencyjnym.' },
  { n: '03', title: 'Pierwsza analiza w 90 s', desc: 'Zobaczysz kondycję pola z satelity i dostaniesz pierwsze obserwacje.' },
];

export default function BetaPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-secondary" />
          <div className="absolute inset-0 cadastral-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_80%)]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2.5 border border-border bg-card px-3 py-1.5 rounded-md mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy animate-pulse" />
            <span className="hud-label">Program pilotażowy · nabór otwarty · sezon 2026/27</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6">
            <span className="relative inline-block pb-3">
              100 gospodarstw widzi więcej.
              <NdviKeyline className="absolute -bottom-0.5 left-0" height={4} />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Szukamy <span className="text-foreground font-medium">100 gospodarstw 20–500 ha</span>,
            które przetestują cyfrowego agronoma na swoich polach —{' '}
            <span className="text-foreground font-medium">za darmo do końca 2026</span>. W zamian
            prosimy o szczery feedback. Tyle.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup?ref=beta100"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold text-lg shadow-card hover:brightness-110 transition-all"
            >
              Dołączam do Beta 100
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/#jak"
              className="inline-flex items-center justify-center px-8 py-4 bg-card text-foreground rounded-md font-semibold text-lg border border-border hover:border-foreground/30 transition"
            >
              Jak to działa
            </Link>
          </div>

          <Link
            href="/login?demo=1"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-signal-healthy hover:underline underline-offset-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
            Najpierw rzuć okiem: gotowe gospodarstwo demo →
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="hud-label">bez karty</span>
            <span className="hud-label">bez umowy</span>
            <span className="hud-label">rezygnujesz kiedy chcesz</span>
          </div>
        </div>
      </section>

      {/* ── Co dostajesz ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="hud-label mb-2">W pakiecie pilota</div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-8">
            Co dostajesz — bez ograniczeń, przez cały sezon
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {GIVES.map((g) => (
              <div key={g.title} className="rounded-lg bg-card border border-border shadow-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-md bg-signal-healthy/10 border border-signal-healthy/30 text-signal-healthy flex items-center justify-center shrink-0">
                  <g.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-semibold tracking-tight text-foreground">{g.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-3xl">
            Zalecenia AgriClaw wspierają Twoją decyzję — nie zastępują jej. Zabiegi ochrony roślin
            zawsze weryfikujesz z aktualną etykietą środka, pogodą, fazą uprawy i przepisami.
          </p>
        </div>
      </section>

      {/* ── Czego oczekujemy ── */}
      <section className="py-16 bg-secondary/60 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="hud-label mb-2">Umowa jest prosta</div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-8">
            Czego oczekujemy w zamian
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
            {ASKS.map((a) => (
              <div key={a.title} className="rounded-lg bg-card border border-border shadow-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-md bg-secondary border border-border text-foreground flex items-center justify-center shrink-0">
                  <a.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-semibold tracking-tight text-foreground">{a.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 kroki ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="hud-label mb-2">Start</div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-8">
            Od rejestracji do pierwszej analizy
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg bg-card border border-border shadow-card p-5">
                <div className="font-mono tabular text-xs text-signal-healthy font-semibold mb-3">{s.n}</div>
                <div className="font-display font-semibold tracking-tight text-foreground">{s.title}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dla kogo / zaufanie ── */}
      <section className="py-16 bg-secondary/60 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-signal-healthy" />
                <span className="hud-label">Dla kogo</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gospodarstwa 20–500 ha: zboża, rzepak, kukurydza, burak, ziemniaki. Cała Polska —
                priorytetowo Wielkopolska, Kujawsko-Pomorskie i Podlasie (tam planujemy spotkania
                na żywo i współpracę z ODR).
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-signal-healthy" />
                <span className="hud-label">Twoje dane</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Granice pól i historia analiz należą do Ciebie. Nie sprzedajemy danych, nie
                udostępniamy ich osobom trzecim. Konto możesz usunąć w każdej chwili razem z danymi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA końcowe ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Sezon nie poczeka.
          </h2>
          <p className="text-muted-foreground mb-8">
            Nabór trwa do wyczerpania 100 miejsc. Pierwszą analizę pola zobaczysz dziś.
          </p>
          <Link
            href="/signup?ref=beta100"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold text-lg shadow-card hover:brightness-110 transition-all"
          >
            Zajmij miejsce w Beta 100
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
