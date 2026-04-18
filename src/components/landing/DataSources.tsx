'use client';

const SOURCES = [
  { name: 'Sentinel-2', by: 'ESA', tag: 'Copernicus', desc: 'NDVI, 10 m, co 5 dni' },
  { name: 'Sentinel-1', by: 'ESA', tag: 'SAR', desc: 'Radar przez chmury' },
  { name: 'SMAP', by: 'NASA', tag: 'L3', desc: 'Wilgotność gleby' },
  { name: 'Open-Meteo', by: 'open-meteo.com', tag: 'ECMWF', desc: 'Pogoda + ET0' },
  { name: 'OpenStreetMap', by: 'OSM', tag: 'geocode', desc: 'Adresy i mapy' },
  { name: 'OpenClaw', by: 'clawlabs.pro', tag: 'AI agent', desc: 'Własny agent AI' },
];

export function DataSources() {
  return (
    <section className="py-20 bg-emerald-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="mb-12 text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-emerald-300 bg-emerald-500/10 rounded-full px-3 py-1 mb-4 ring-1 ring-emerald-400/20">
            100% darmowe źródła
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Dane publiczne. Prywatne tylko co o Tobie wiemy —
            <br className="hidden sm:block" />
            <span className="text-emerald-300">czyli nic poza pozycją pól.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SOURCES.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl bg-white/5 backdrop-blur-sm ring-1 ring-white/10 p-5 hover:bg-white/10 transition"
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-bold text-lg">{s.name}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                  {s.tag}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-3">
                {s.by}
              </div>
              <div className="text-sm text-white/80">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
