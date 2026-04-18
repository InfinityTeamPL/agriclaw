'use client';

// Widok szczegółów pola — split view:
//  - lewa strona: mapa heatmap NDVI (60% viewport na desktopie)
//  - prawa strona: sticky sidebar ze statystyką NDVI + sparkline + tabs
// Tabs: Analiza / Historia / Rekomendacje.

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Loader2,
  Satellite,
  Sprout,
  Droplets,
  ArrowUp,
  ArrowDown,
  Minus,
  CloudSun,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { classifyNdvi, ndviColorHex, describeNdvi } from '@/lib/satellite/ndvi';
import {
  cropLabel,
  formatDatePL,
  formatDateTimePL,
  formatHa,
  severityStyle,
} from '@/lib/ui/format';
import { FieldLayerMap } from '@/components/dashboard/FieldLayerMap';
import { BbchTracker } from '@/components/dashboard/BbchTracker';
import { HistoryChart } from '@/components/dashboard/HistoryChart';
import { ThermalBadge } from '@/components/dashboard/ThermalBadge';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { MultiIndexPanel } from '@/components/dashboard/MultiIndexPanel';
import { SprayTimer } from '@/components/dashboard/SprayTimer';
import { FrostAlert } from '@/components/dashboard/FrostAlert';

interface Field {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  createdAt: string;
}

interface IndexVal {
  mean: number;
  min: number;
  max: number;
}

interface NdviPoint {
  id: string;
  observedAt: string;
  mean: number;
  min: number;
  max: number;
  cloudCover: number;
  indices?: {
    ndvi: IndexVal;
    ndre: IndexVal | null;
    ndwi: IndexVal | null;
    savi: IndexVal | null;
  };
}

interface Recommendation {
  id: string;
  severity: string;
  title: string;
  message: string;
  action: string;
  createdAt: string;
}

interface Props {
  field: Field;
  ndviHistory: NdviPoint[];
  recommendations: Recommendation[];
}

type TabKey = 'analysis' | 'history' | 'recs';

export function FieldDetailView({ field, ndviHistory, recommendations }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<TabKey>('analysis');

  const latest = ndviHistory[0];
  const previous = ndviHistory[1];
  const trend = latest && previous ? latest.mean - previous.mean : null;

  const seriesChronological = [...ndviHistory].reverse().map((r) => r.mean);

  const handleRunAnalysis = async () => {
    if (running) return;
    setRunning(true);
    toast.info('Uruchamiam analizę satelitarną. To może potrwać 10–30 sekund.');
    try {
      const res = await fetch(`/api/analysis/${field.id}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Analiza nie powiodła się. Spróbuj ponownie.',
        );
        setRunning(false);
        return;
      }
      toast.success('Analiza zakończona.');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-medium">
            <Sprout className="w-3.5 h-3.5" />
            {cropLabel(field.crop)}
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            {field.name}
          </h1>
          <div className="mt-1 text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>{formatHa(field.areaHectares)} ha</span>
            <span className="text-gray-300">·</span>
            <span>dodane {formatDatePL(field.createdAt)}</span>
            {latest && (
              <>
                <span className="text-gray-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <Satellite className="w-3.5 h-3.5" />
                  dane z {formatDateTimePL(latest.observedAt)}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="relative">
          {!running && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-emerald-500/50 animate-ping opacity-60" aria-hidden="true" />
              <span className="absolute inset-0 rounded-2xl bg-emerald-500/30 animate-pulse" aria-hidden="true" />
            </>
          )}
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={running}
            className={cn(
              'relative inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition shadow-[0_10px_25px_-10px_rgba(16,185,129,0.7)] hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.9)]',
              running
                ? 'bg-emerald-500 text-white cursor-not-allowed opacity-90'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:-translate-y-0.5',
            )}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Satellite className="w-4 h-4" />}
            {running ? 'Analizuję...' : 'Uruchom analizę'}
          </button>
        </div>
      </motion.div>

      {running && <AnalysisProgress />}

      {/* BBCH + Spray Timer — faza rozwoju + okno oprysku 72h */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
        <BbchTracker fieldId={field.id} />
        <SprayTimer fieldId={field.id} />
      </div>

      {/* Frost alert — prognoza przymrozków 10 nocy, krytyczne w kwietniu */}
      <FrostAlert fieldId={field.id} />

      {/* Historia Sentinel-2 10 lat */}
      <HistoryChart fieldId={field.id} />

      {/* Thermal Landsat 8/9 — na żądanie */}
      <ThermalBadge fieldId={field.id} />

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]"
        >
          <FieldLayerMap
            fieldId={field.id}
            polygon={field.polygon}
            centroid={field.centroid}
            className="relative w-full h-[420px] sm:h-[520px] lg:h-[620px]"
          />
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 lg:sticky lg:top-20 lg:self-start"
        >
          {/* NDVI Big card */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              Aktualny NDVI
            </div>
            {latest ? (
              <CurrentNdvi
                mean={latest.mean}
                min={latest.min}
                max={latest.max}
                crop={field.crop}
                observedAt={latest.observedAt}
                cloudCover={latest.cloudCover}
                trend={trend}
              />
            ) : (
              <div className="mt-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                Nie przeprowadzono jeszcze analizy. Kliknij „Uruchom analizę", aby pobrać
                aktualne dane satelitarne.
              </div>
            )}

            {seriesChronological.length >= 2 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Trend NDVI</span>
                  <span>{seriesChronological.length} obserwacji</span>
                </div>
                <Sparkline
                  values={seriesChronological}
                  color={latest ? ndviColorHex(latest.mean) : '#059669'}
                  height={48}
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 overflow-hidden shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
            <div className="flex items-center p-1.5 m-1.5 rounded-2xl bg-gray-100/70">
              <TabButton active={tab === 'analysis'} onClick={() => setTab('analysis')}>
                Analiza
              </TabButton>
              <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
                Historia
              </TabButton>
              <TabButton active={tab === 'recs'} onClick={() => setTab('recs')}>
                Rekomendacje
              </TabButton>
            </div>
            <div className="p-4 sm:p-5 max-h-[520px] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {tab === 'analysis' && (
                    <AnalysisTab latest={latest} crop={field.crop} field={field} />
                  )}
                  {tab === 'history' && <HistoryTab history={ndviHistory} />}
                  {tab === 'recs' && <RecsTab recs={recommendations} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition',
        active
          ? 'bg-white text-emerald-700 shadow-sm'
          : 'text-gray-500 hover:text-gray-900',
      )}
    >
      {children}
    </button>
  );
}

function AnalysisTab({
  latest,
  crop,
  field,
}: {
  latest: NdviPoint | undefined;
  crop: string;
  field: Field;
}) {
  if (!latest) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        Brak danych — uruchom analizę, aby zobaczyć szczegóły wegetacji.
      </div>
    );
  }
  const idx = latest.indices;
  return (
    <div className="space-y-4 text-sm">
      {/* Metadata row */}
      <div className="grid grid-cols-2 gap-2">
        <MetricMini
          label="Zachmurzenie"
          value={`${Math.round(latest.cloudCover * 100)}%`}
          icon={<CloudSun className="w-3.5 h-3.5 text-sky-600" />}
        />
        <MetricMini
          label="Powierzchnia"
          value={`${formatHa(field.areaHectares)} ha`}
          icon={<Droplets className="w-3.5 h-3.5 text-sky-600" />}
        />
      </div>

      {/* 4 indeksy Sentinel-2 */}
      {idx && (
        <MultiIndexPanel
          ndvi={idx.ndvi}
          ndre={idx.ndre}
          ndwi={idx.ndwi}
          savi={idx.savi}
          crop={crop}
        />
      )}

      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-100 p-3 text-sm text-gray-800">
        {describeNdvi(latest.mean, crop)}
      </div>
      <a
        href="/dashboard/agent"
        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-gray-900 text-white text-sm hover:bg-gray-800 transition"
      >
        <span className="inline-flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-300" />
          Zapytaj agenta o to pole
        </span>
        <span className="text-emerald-300">→</span>
      </a>
    </div>
  );
}

function HistoryTab({ history }: { history: NdviPoint[] }) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        Historia jest pusta — uruchom pierwszą analizę.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {history.map((r) => {
        const color = ndviColorHex(r.mean);
        return (
          <li
            key={r.id}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">
                NDVI {r.mean.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">
                zakres {r.min.toFixed(2)}–{r.max.toFixed(2)} · zachmurzenie{' '}
                {Math.round(r.cloudCover * 100)}%
              </div>
            </div>
            <div className="text-xs text-gray-500 shrink-0 text-right">
              {formatDateTimePL(r.observedAt)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RecsTab({ recs }: { recs: Recommendation[] }) {
  if (recs.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        Brak rekomendacji. Uruchom analizę, aby otrzymać pierwszą.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {recs.map((r) => {
        const style = severityStyle(r.severity);
        return (
          <li
            key={r.id}
            className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.pill}`}
              >
                {style.label}
              </span>
              <span className="font-medium text-gray-900 text-sm">{r.title}</span>
              <span className="text-[11px] text-gray-400 ml-auto">
                {formatDateTimePL(r.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
            {r.action && (
              <p className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 whitespace-pre-wrap">
                <span className="font-semibold">Co zrobić: </span>
                {r.action}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MetricMini({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function CurrentNdvi({
  mean,
  min,
  max,
  crop,
  observedAt,
  cloudCover,
  trend,
}: {
  mean: number;
  min: number;
  max: number;
  crop: string;
  observedAt: string;
  cloudCover: number;
  trend: number | null;
}) {
  const color = ndviColorHex(mean);
  const cls = classifyNdvi(mean);
  const classLabel: Record<typeof cls, string> = {
    bare: 'Goła ziemia',
    stressed: 'Stres roślin',
    moderate: 'Średnia kondycja',
    healthy: 'Zdrowe',
    'very-healthy': 'Bardzo zdrowe',
  };
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-baseline gap-3">
        <div className="text-5xl font-semibold tracking-tight tabular-nums" style={{ color }}>
          {mean.toFixed(2)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{classLabel[cls]}</div>
          <div className="text-xs text-gray-500">
            zakres {min.toFixed(2)}–{max.toFixed(2)}
          </div>
        </div>
        {trend !== null && (
          <TrendBadge delta={trend} />
        )}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{describeNdvi(mean, crop)}</p>
      <div className="text-[11px] text-gray-400">
        Dane z {formatDateTimePL(observedAt)} · zachmurzenie {Math.round(cloudCover * 100)}%
      </div>
    </div>
  );
}

function TrendBadge({ delta }: { delta: number }) {
  const abs = Math.abs(delta);
  if (abs < 0.01) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
        <Minus className="w-3 h-3" />
        bez zmian
      </div>
    );
  }
  if (delta > 0) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
        <ArrowUp className="w-3 h-3" />+{delta.toFixed(2)}
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
      <ArrowDown className="w-3 h-3" />
      {delta.toFixed(2)}
    </div>
  );
}

function AnalysisProgress() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-r from-emerald-50 via-lime-50 to-sky-50 border border-emerald-200/60 p-4 flex items-center gap-4"
    >
      <div className="relative w-12 h-12 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <Satellite className="absolute inset-0 m-auto w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <div className="font-semibold text-gray-900">Pobieram dane satelitarne</div>
        <div className="text-sm text-gray-600">
          Sentinel-2 NDVI + prognoza pogody + rekomendacja — to potrwa 10–30 sekund.
        </div>
      </div>
    </motion.div>
  );
}
