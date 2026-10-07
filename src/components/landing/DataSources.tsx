import Image from 'next/image';
import {
  Satellite,
  Radar,
  Thermometer,
  CloudSun,
  FileCheck2,
  Sprout,
} from 'lucide-react';
import { Eyebrow, WRAP } from './ui';

// Nazwane, sprawdzalne źródła — jury (CASSINI/Copernicus, AGROSTRATEG) pyta
// „skąd te dane?". Każdy wpis ma realny odpowiednik w kodzie (lib/satellite, lib/sor-registry, lib/bbch).
const ITEMS = [
  {
    icon: Satellite,
    title: 'Sentinel-2 · 10 m',
    source: 'Copernicus · ESA',
    desc: 'Zdrowie roślin (NDVI), azot w liściach (NDRE), woda w roślinie (NDWI). Nowe zdjęcie co 2–5 dni.',
  },
  {
    icon: Radar,
    title: 'Sentinel-1 · radar',
    source: 'Copernicus · ESA',
    desc: 'Radar widzi przez chmury. Gdy pada tydzień, i tak wiesz, co dzieje się na polu.',
  },
  {
    icon: Thermometer,
    title: 'Landsat · termika',
    source: 'NASA / USGS',
    desc: 'Temperatura powierzchni pola — przegrzanie i stres wodny widać, zanim liście zżółkną.',
  },
  {
    icon: CloudSun,
    title: 'Pogoda godzinowa',
    source: 'Open-Meteo · modele ECMWF/ICON',
    desc: 'Opad, wiatr, przymrozek i parowanie (ET₀) na 7 dni — liczone dla współrzędnych Twojego pola.',
  },
  {
    icon: FileCheck2,
    title: 'Rejestr ŚOR',
    source: 'MRiRW · dane.gov.pl',
    desc: 'Aktualna lista dopuszczonych środków i terminy wycofań. Odświeżana automatycznie co tydzień.',
  },
  {
    icon: Sprout,
    title: 'Fazy rozwojowe BBCH',
    source: 'Model sum temperatur (GDD)',
    desc: 'Z daty siewu i temperatur liczymy fazę rośliny — stąd wiemy, kiedy nawozić i kiedy grozi choroba.',
  },
];

export function DataSources() {
  return (
    <section id="zrodla" className="scroll-mt-24 py-[75px] md:py-[110px]">
      <div className={WRAP}>
        {/* Panel ze zdjęciem + szklana karta (jak „image-panel" w wariancie filmowym) */}
        <div className="relative h-[480px] overflow-hidden rounded-[20px] md:h-[620px]">
          <Image
            src="/landing/agriclaw-field-analysis.webp"
            alt="Widok pól z lotu ptaka z ilustracyjną wizualizacją kondycji roślin"
            fill
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover"
          />
          <div className="absolute bottom-4 right-4 w-[calc(100%-32px)] rounded-xl border border-white/40 bg-[#0c1f14]/80 p-6 backdrop-blur-xl sm:bottom-6 sm:right-6 sm:w-[min(420px,calc(100%-48px))]">
            <Eyebrow>Skąd bierzemy dane</Eyebrow>
            <strong className="mb-1 mt-5 block font-[family-name:var(--font-manrope)] text-[23px] leading-tight tracking-[-0.05em]">
              Otwarte dane, sprawdzalne źródła — Ty widzisz tylko gotową odpowiedź.
            </strong>
            <p className="mt-3 text-[11px] uppercase tracking-[0.12em] opacity-60">
              Zdjęcie ilustracyjne, nie odczyt rzeczywisty
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-x-3.5 gap-y-10 rounded-[24px] bg-[#182a1c] p-6 sm:grid-cols-2 md:p-[50px] lg:grid-cols-3">
          {ITEMS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="border-t border-current px-2 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] uppercase tracking-[0.12em]">{s.source}</span>
                  <Icon className="h-5 w-5 text-[#b4e46c]" aria-hidden="true" />
                </div>
                <b className="mb-2 mt-4 block font-[family-name:var(--font-manrope)] text-xl tracking-[-0.04em]">
                  {s.title}
                </b>
                <p className="max-w-[38ch] text-[15px] leading-[1.55] opacity-70">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
