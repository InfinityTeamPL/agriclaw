'use client';

// Lista pól z filtrem (uprawa), sortowaniem (data/NDVI/powierzchnia) i trybem widoku.
// Grid z polygon thumbami albo lista tabelaryczna.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  List,
  Search,
  ArrowUpRight,
  Sprout,
  Calendar,
  Ruler,
  ArrowDownUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cropLabel, formatDatePL, formatHa, CROPS, formatFixedPL } from '@/lib/ui/format';
import { classifyNdvi } from '@/lib/satellite/ndvi';
import { ndviColorHex } from '@/lib/design/ndvi-scale';
import { FieldSatThumb } from '@/components/dashboard/FieldSatThumb';

export interface FieldListItem {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  createdAt: string;
  polygon: GeoJSON.Polygon;
  ndviMean: number | null;
  ndviObservedAt: string | null;
}

type SortKey = 'created' | 'ndvi' | 'area' | 'name';
type ViewMode = 'grid' | 'list';

export function FieldsList({ items }: { items: FieldListItem[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [view, setView] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');

  const availableCrops = useMemo(() => {
    const used = new Set(items.map((i) => i.crop));
    return CROPS.filter((c) => used.has(c.value));
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter((i) => i.crop === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));

    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'ndvi': {
          const va = a.ndviMean ?? -1;
          const vb = b.ndviMean ?? -1;
          return vb - va;
        }
        case 'area':
          return b.areaHectares - a.areaHectares;
        case 'name':
          return a.name.localeCompare(b.name, 'pl');
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sorted;
  }, [filter, query, sortKey, items]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="rounded-lg bg-card border border-border p-3 sm:p-4 flex flex-wrap items-center gap-3 shadow-card">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj pola po nazwie..."
            aria-label="Szukaj pola po nazwie"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-h-11 pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        {/* Crop filter */}
        <div className="flex items-center gap-2 text-sm">
          <Sprout className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filtruj wg uprawy"
            className="min-h-11 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="all">Wszystkie uprawy ({items.length})</option>
            {availableCrops.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-sm">
          <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sortuj"
            className="min-h-11 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="created">Najnowsze</option>
            <option value="ndvi">Najwyższy NDVI</option>
            <option value="area">Największe pole</option>
            <option value="name">Nazwa (A–Z)</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="inline-flex items-center p-1 rounded-md bg-secondary">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 min-h-10 rounded-md text-xs font-medium transition',
              view === 'grid'
                ? 'bg-card text-primary shadow-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={view === 'grid'}
            aria-label="Widok siatki"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Siatka</span>
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 min-h-10 rounded-md text-xs font-medium transition',
              view === 'list'
                ? 'bg-card text-primary shadow-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={view === 'list'}
            aria-label="Widok listy"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-10 text-center text-sm text-muted-foreground space-y-3">
          <p>Brak pól pasujących do filtru.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
            className="min-h-11 rounded-md border border-border px-4 font-medium text-foreground hover:bg-secondary transition"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
        >
          {filtered.map((f) => (
            <motion.div
              key={f.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
              <FieldGridCard field={f} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-lg bg-card border border-border overflow-hidden shadow-card">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border hud-label bg-secondary">
            <div className="col-span-5">Pole</div>
            <div className="col-span-2">Uprawa</div>
            <div className="col-span-2">Powierzchnia</div>
            <div className="col-span-2">Ostatnia analiza</div>
            <div className="col-span-1 text-right">NDVI</div>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((f) => (
              <li key={f.id} className="hover:bg-secondary transition">
                <Link
                  href={`/dashboard/fields/${f.id}`}
                  className="grid grid-cols-12 gap-4 px-5 py-3 items-center"
                >
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-12 h-10 rounded-md bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                      <FieldSatThumb
                        fieldId={f.id}
                        version={f.ndviObservedAt}
                        polygon={f.polygon}
                        fallbackColor={f.ndviMean !== null ? ndviColorHex(f.ndviMean) : '#1c7a3c'}
                        className="w-full h-full p-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{f.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden mt-0.5 tabular">
                        {cropLabel(f.crop)} · {formatHa(f.areaHectares)} ha
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm text-foreground">
                    {cropLabel(f.crop)}
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm font-mono tabular text-foreground">
                    {formatHa(f.areaHectares)} ha
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm font-mono tabular text-muted-foreground">
                    {f.ndviObservedAt ? formatDatePL(f.ndviObservedAt) : 'Nie uruchomiono'}
                  </div>
                  <div className="col-span-12 md:col-span-1 md:text-right">
                    <NdviCell mean={f.ndviMean} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FieldGridCard({ field }: { field: FieldListItem }) {
  // Fallback MUSI być hexem — PolygonThumb używa koloru w atrybutach SVG i buduje
  // z niego id gradientu; CSS var()/nawiasy/spacje psują render (niewidoczna miniatura).
  const ndviColor = field.ndviMean !== null ? ndviColorHex(field.ndviMean) : '#64748b';
  const cls = field.ndviMean !== null ? classifyNdvi(field.ndviMean) : null;
  const classLabel: Record<string, string> = {
    bare: 'goła ziemia',
    stressed: 'stres',
    moderate: 'średnio',
    healthy: 'zdrowe',
    'very-healthy': 'bujne',
  };

  return (
    <Link
      href={`/dashboard/fields/${field.id}`}
      className="group relative block rounded-lg bg-card border border-border overflow-hidden hover:-translate-y-1 hover:shadow-pop shadow-card transition-all duration-300"
    >
      <div className="relative h-36 overflow-hidden bg-secondary cadastral-grid">
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <FieldSatThumb fieldId={field.id} version={field.ndviObservedAt} polygon={field.polygon} fallbackColor={ndviColor} className="w-full h-full" />
        </div>
        {/* Top-left: crop */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-card border border-border text-foreground">
          <Sprout className="w-3 h-3 text-primary" />
          {cropLabel(field.crop)}
        </div>
        {/* Top-right: NDVI — kolor danych z rampy NDVI */}
        <div className="absolute top-3 right-3">
          {field.ndviMean !== null ? (
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular font-semibold px-2.5 py-1 rounded-md bg-card border text-foreground"
              style={{ borderColor: `${ndviColor}55` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ndviColor }} />
              NDVI {formatFixedPL(field.ndviMean, 2)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-card border border-border text-muted-foreground">
              Brak analizy
            </div>
          )}
        </div>
        {/* Hover quick actions */}
        <div className="absolute bottom-3 right-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground">
            Otwórz pole
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="font-display font-semibold text-foreground tracking-tight truncate group-hover:text-primary transition">
          {field.name}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-mono tabular">
            <Ruler className="w-3 h-3" />
            {formatHa(field.areaHectares)} ha
          </span>
          <span className="inline-flex items-center gap-1 font-mono tabular">
            <Calendar className="w-3 h-3" />
            {formatDatePL(field.createdAt)}
          </span>
          {cls && <span className="text-foreground">{classLabel[cls]}</span>}
        </div>
      </div>
    </Link>
  );
}

function NdviCell({ mean }: { mean: number | null }) {
  if (mean === null) {
    return <span className="text-xs text-muted-foreground inline-block font-mono">—</span>;
  }
  const color = ndviColorHex(mean);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-mono tabular font-semibold px-2 py-0.5 rounded-md border text-foreground"
      style={{ backgroundColor: `${color}1A`, borderColor: `${color}55` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {formatFixedPL(mean, 2)}
    </span>
  );
}
