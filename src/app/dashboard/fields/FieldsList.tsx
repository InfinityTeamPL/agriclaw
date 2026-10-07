'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownUp,
  ArrowUpRight,
  Check,
  Clock3,
  Database,
  LayoutGrid,
  List,
  Satellite,
  Search,
  SlidersHorizontal,
  Sprout,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cropLabel, formatDatePL, formatHa, formatIndexPL, pluralPL, CROPS } from '@/lib/ui/format';
import {
  compareReadingPriority,
  getReadingStatus,
  matchesReadingFilter,
  normalizeFieldSearch,
  isValidNdvi,
  RECENT_READING_DAYS,
  type FieldReading,
  type ReadingFilter,
  type ReadingStatus,
} from '@/lib/ui/field-monitoring';
import { ndviColorHex } from '@/lib/design/ndvi-scale';
import { FieldSatThumb } from '@/components/dashboard/FieldSatThumb';

export interface FieldListItem extends FieldReading {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  createdAt: string;
  polygon: GeoJSON.Polygon;
}

type SortKey = 'review' | 'created' | 'ndvi-low' | 'ndvi' | 'area' | 'name';
type ViewMode = 'grid' | 'list';
const SORT_KEYS: SortKey[] = ['review', 'created', 'ndvi-low', 'ndvi', 'area', 'name'];
const PREFERENCES_KEY = 'agriclaw.fields.display.v1';
const focusClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const STATUS: Record<ReadingStatus, { label: string; tone: string }> = {
  recent: { label: 'Ostatnie 14 dni', tone: 'border-primary/20 bg-primary/5 text-primary' },
  older: { label: 'Starszy pomiar', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  missing: { label: 'Brak pomiaru', tone: 'border-border bg-secondary text-muted-foreground' },
  demo: { label: 'Dane demo', tone: 'border-violet-200 bg-violet-50 text-violet-800' },
  archive: {
    label: 'Archiwum miesięczne',
    tone: 'border-border bg-secondary text-muted-foreground',
  },
  unknown: { label: 'Dane do sprawdzenia', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
};

export function FieldsList({ items, asOf }: { items: FieldListItem[]; asOf: string }) {
  const [crop, setCrop] = useState('all');
  const [readingFilter, setReadingFilter] = useState<ReadingFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('review');
  const [view, setView] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null');
      if (saved?.view === 'grid' || saved?.view === 'list') setView(saved.view);
      if (SORT_KEYS.includes(saved?.sort)) setSortKey(saved.sort);
    } catch {
      // Display preferences are optional (private browsing/storage restrictions).
    }
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ view, sort: sortKey }));
    } catch {
      // Searching and filtering still work when storage is unavailable.
    }
  }, [view, sortKey, preferencesLoaded]);

  const statuses = useMemo(
    () => new Map(items.map((field) => [field.id, getReadingStatus(field, asOf)])),
    [items, asOf]
  );
  const counts = useMemo(() => {
    const result = { all: items.length, recent: 0, review: 0, demo: 0 };
    for (const status of statuses.values()) {
      if (status === 'recent') result.recent++;
      else if (status === 'demo') result.demo++;
      else result.review++;
    }
    return result;
  }, [items.length, statuses]);

  const availableCrops = useMemo(() => {
    const used = new Set(items.map((field) => field.crop));
    return CROPS.filter((entry) => used.has(entry.value));
  }, [items]);

  const filtered = useMemo(() => {
    const search = normalizeFieldSearch(query);
    return items
      .filter((field) => {
        if (crop !== 'all' && field.crop !== crop) return false;
        if (!matchesReadingFilter(statuses.get(field.id)!, readingFilter)) return false;
        return (
          !search || normalizeFieldSearch(`${field.name} ${cropLabel(field.crop)}`).includes(search)
        );
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'review':
            return compareReadingPriority(a, b, asOf) || a.name.localeCompare(b.name, 'pl');
          case 'ndvi':
          case 'ndvi-low': {
            const aValid = isValidNdvi(a.ndviMean);
            const bValid = isValidNdvi(b.ndviMean);
            if (!aValid || !bValid) return Number(bValid) - Number(aValid);
            return sortKey === 'ndvi' ? b.ndviMean! - a.ndviMean! : a.ndviMean! - b.ndviMean!;
          }
          case 'area':
            return b.areaHectares - a.areaHectares;
          case 'name':
            return a.name.localeCompare(b.name, 'pl');
          default:
            return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        }
      });
  }, [items, crop, readingFilter, query, sortKey, statuses, asOf]);

  const hasFilters = crop !== 'all' || readingFilter !== 'all' || query.length > 0;
  const resetFilters = () => {
    setCrop('all');
    setReadingFilter('all');
    setQuery('');
  };
  const filteredHa = filtered.reduce((sum, field) => sum + field.areaHectares, 0);

  return (
    <div className="space-y-5">
      <section
        aria-labelledby="field-data-heading"
        className="overflow-hidden rounded-lg border border-border bg-card"
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary">
              <Satellite className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="field-data-heading"
                className="font-display text-base font-semibold text-foreground"
              >
                Świeżość danych satelitarnych
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Pomiar z ostatnich {RECENT_READING_DAYS} dni:{' '}
                <span className="font-semibold tabular text-foreground">
                  {counts.recent} z {counts.all} {counts.all === 1 ? 'pola' : 'pól'}
                </span>.
                {counts.review > 0 && ' Sprawdź pola ze starszymi lub brakującymi danymi.'}
              </p>
            </div>
          </div>
          <div className="sm:w-44 sm:shrink-0">
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
              {counts.all > 0 && (
                <>
                  <span
                    className="bg-primary"
                    style={{ width: `${(counts.recent / counts.all) * 100}%` }}
                  />
                  <span
                    className="bg-amber-400"
                    style={{ width: `${(counts.review / counts.all) * 100}%` }}
                  />
                  <span
                    className="bg-violet-400"
                    style={{ width: `${(counts.demo / counts.all) * 100}%` }}
                  />
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Stan na {formatDatePL(asOf)}</p>
          </div>
        </div>
        <div
          role="group"
          aria-label="Filtruj według stanu danych"
          className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4"
        >
          <DataFilter
            label="Wszystkie pola"
            count={counts.all}
            icon={LayoutGrid}
            active={readingFilter === 'all'}
            onClick={() => setReadingFilter('all')}
          />
          <DataFilter
            label="Ostatnie 14 dni"
            count={counts.recent}
            icon={Check}
            active={readingFilter === 'recent'}
            onClick={() => setReadingFilter('recent')}
          />
          <DataFilter
            label="Do sprawdzenia"
            count={counts.review}
            icon={Clock3}
            active={readingFilter === 'review'}
            onClick={() => setReadingFilter('review')}
          />
          <DataFilter
            label="Dane demo"
            count={counts.demo}
            icon={Database}
            active={readingFilter === 'demo'}
            onClick={() => setReadingFilter('demo')}
          />
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="field-search"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Znajdź pole
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="field-search"
                type="search"
                autoComplete="off"
                placeholder="Nazwa pola lub uprawa…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-11 w-full rounded-md border border-input bg-card pl-9 pr-10 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Wyczyść wyszukiwanie"
                  onClick={() => setQuery('')}
                  className={cn(
                    'absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground',
                    focusClass
                  )}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:flex">
            <div className="xl:w-44">
              <label
                htmlFor="field-crop"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                Uprawa
              </label>
              <select
                id="field-crop"
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Wszystkie uprawy</option>
                {availableCrops.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="xl:w-60">
              <label
                htmlFor="field-sort"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground"
              >
                <ArrowDownUp className="h-3 w-3" aria-hidden="true" />
                Kolejność
              </label>
              <select
                id="field-sort"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="review">Najpierw do sprawdzenia</option>
                <option value="created">Ostatnio dodane</option>
                <option value="ndvi-low">NDVI: od najniższego</option>
                <option value="ndvi">NDVI: od najwyższego</option>
                <option value="area">Powierzchnia: od największej</option>
                <option value="name">Nazwa: A–Z</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-sm text-muted-foreground"
            >
              <span className="font-medium tabular text-foreground">{filtered.length}</span>{' '}
              {pluralPL(filtered.length, 'pole', 'pola', 'pól')}
              {hasFilters && ` z ${items.length}`}
              <span className="ml-2 tabular">{formatHa(filteredHa)} ha</span>
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary/5',
                  focusClass
                )}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Wyczyść filtry
              </button>
            )}
          </div>
          <div
            role="group"
            aria-label="Widok pól"
            className="inline-flex gap-1 rounded-md border border-border bg-secondary p-1"
          >
            {(['grid', 'list'] as const).map((mode) => {
              const Icon = mode === 'grid' ? LayoutGrid : List;
              const label = mode === 'grid' ? 'Siatka' : 'Lista';
              return (
                <button
                  key={mode}
                  type="button"
                  aria-label={`Widok: ${label.toLowerCase()}`}
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-3 text-xs font-medium transition-colors',
                    view === mode
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    focusClass
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
          <SlidersHorizontal
            className="mx-auto mb-3 h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="font-display text-lg font-semibold text-foreground">Nie znaleziono pól</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {query
              ? `Brak wyników dla „${query}” przy wybranych filtrach.`
              : 'Żadne pole nie pasuje do wybranej uprawy i stanu danych.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className={cn(
                'mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110',
                focusClass
              )}
            >
              Pokaż wszystkie pola
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((field) => (
            <li key={field.id}>
              <FieldGridCard field={field} status={statuses.get(field.id)!} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div
            aria-hidden="true"
            className="hidden grid-cols-12 gap-4 border-b border-border bg-secondary px-5 py-3 text-xs font-medium text-muted-foreground lg:grid"
          >
            <div className="col-span-4">Pole / uprawa</div>
            <div className="col-span-2">Powierzchnia</div>
            <div className="col-span-4">Pomiar satelitarny</div>
            <div className="col-span-2 text-right">NDVI</div>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((field) => {
              const status = statuses.get(field.id)!;
              return (
                <li key={field.id}>
                  <Link
                    href={`/dashboard/fields/${field.id}`}
                    className={cn(
                      'grid grid-cols-[minmax(0,1fr)_auto] items-center lg:grid-cols-12 gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-secondary/60 sm:px-5',
                      focusClass
                    )}
                  >
                    <div className="col-span-1 flex min-w-0 items-center gap-3 lg:col-span-4">
                      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                        <FieldSatThumb
                          fieldId={field.id}
                          version={field.ndviObservedAt}
                          polygon={field.polygon}
                          fallbackColor={fieldColor(field)}
                          className="h-full w-full p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="break-words font-medium leading-snug text-foreground lg:truncate">
                          {field.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {cropLabel(field.crop)}{' '}
                          <span className="ml-2 tabular lg:hidden">
                            {formatHa(field.areaHectares)} ha
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden text-sm tabular text-foreground lg:col-span-2 lg:block">
                      {formatHa(field.areaHectares)} ha
                    </div>
                    <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 lg:col-span-4 lg:row-auto lg:block">
                      <ReadingBadge status={status} />
                      <p className="text-xs text-muted-foreground lg:mt-1.5">
                        <ReadingDescription field={field} status={status} />
                      </p>
                    </div>
                    <div className="col-span-1 col-start-2 row-start-1 text-right lg:col-span-2 lg:col-start-auto lg:row-auto">
                      <NdviCell mean={field.ndviMean} demo={status === 'demo'} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        Świeżość pomiaru nie oznacza dobrej kondycji pola. NDVI pokazuje roślinność; interpretacja
        zależy od uprawy i fazy sezonu. Dane demo są symulacją. Data dotyczy zapisanego NDVI;
        miniatura może pokazywać nowszą warstwę.
      </p>
    </div>
  );
}

function DataFilter({
  label,
  count,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof Satellite;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-h-16 items-center justify-between gap-2 px-3 py-3 text-left transition-colors sm:px-4',
        active
          ? 'bg-primary/5 text-primary shadow-[inset_0_-2px_0_hsl(var(--primary))]'
          : 'bg-card text-muted-foreground hover:bg-secondary',
        focusClass
      )}
    >
      <span className="flex min-w-0 items-center gap-2 text-xs font-medium sm:text-sm">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span
        className={cn('text-lg font-semibold tabular', active ? 'text-primary' : 'text-foreground')}
      >
        {count}
      </span>
    </button>
  );
}

function ReadingBadge({ status }: { status: ReadingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium',
        STATUS[status].tone
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS[status].label}
    </span>
  );
}

function ReadingDescription({ field, status }: { field: FieldListItem; status: ReadingStatus }) {
  if (status === 'missing') return <>Otwórz pole i uruchom analizę</>;
  if (status === 'demo') return <>Symulacja, bez pomiaru satelitarnego</>;
  if (status === 'archive') return <>Kompozyt miesięczny, bez dokładnej daty sceny</>;
  if (status === 'unknown') return <>Źródło lub data wymagają sprawdzenia</>;
  return (
    <>
      Sentinel-2 ·{' '}
      <time dateTime={field.ndviObservedAt!}>{formatDatePL(field.ndviObservedAt)}</time>
    </>
  );
}

function fieldColor(field: FieldListItem) {
  return field.ndviSource !== 'mock' && isValidNdvi(field.ndviMean)
    ? ndviColorHex(field.ndviMean)
    : '#64748b';
}

function FieldGridCard({ field, status }: { field: FieldListItem; status: ReadingStatus }) {
  return (
    <Link
      href={`/dashboard/fields/${field.id}`}
      className={cn(
        'group block h-full overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40',
        focusClass
      )}
    >
      <div className="relative h-36 overflow-hidden border-b border-border bg-secondary cadastral-grid">
        <div className="absolute inset-0 flex items-center justify-center px-5 pb-3 pt-10">
          <FieldSatThumb
            fieldId={field.id}
            version={field.ndviObservedAt}
            polygon={field.polygon}
            fallbackColor={fieldColor(field)}
            className="h-full w-full"
          />
        </div>
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground">
          <Sprout className="h-3 w-3 text-primary" aria-hidden="true" />
          {cropLabel(field.crop)}
        </div>
        <div className="absolute right-3 top-3">
          <NdviCell mean={field.ndviMean} demo={status === 'demo'} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate font-display text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
            {field.name}
          </h3>
          <ArrowUpRight
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
        <p className="mt-1 text-xs tabular text-muted-foreground">
          {formatHa(field.areaHectares)} ha
        </p>
        <div className="mt-4 border-t border-border pt-3">
          <ReadingBadge status={status} />
          <p className="mt-2 text-xs text-muted-foreground">
            <ReadingDescription field={field} status={status} />
          </p>
        </div>
      </div>
    </Link>
  );
}

function NdviCell({ mean, demo }: { mean: number | null; demo: boolean }) {
  if (!isValidNdvi(mean))
    return (
      <span className="rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground">
        Brak NDVI
      </span>
    );
  const color = demo ? '#64748b' : ndviColorHex(mean);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-[11px] font-semibold tabular text-foreground"
      style={{ borderColor: `${color}55` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>
        {demo ? 'Demo' : 'NDVI'} {formatIndexPL(mean)}
      </span>
    </span>
  );
}
