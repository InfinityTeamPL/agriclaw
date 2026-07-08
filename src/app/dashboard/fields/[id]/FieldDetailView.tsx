'use client';

// Widok szczegółów pola — split view:
//  - lewa strona: mapa heatmap NDVI (60% viewport na desktopie)
//  - prawa strona: sticky sidebar ze statystyką NDVI + sparkline + tabs
// Tabs: Analiza / Historia / Rekomendacje.

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
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
import { classifyNdvi, describeNdvi } from '@/lib/satellite/ndvi';
import { ndviColorHex } from '@/lib/design/ndvi-scale';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { ScanLine } from '@/components/brand/ScanLine';
import { AdvisoryNotice } from '@/components/dashboard/AdvisoryNotice';
import { isPlantProtectionText } from '@/lib/advisory';
import {
  cropLabel,
  formatDatePL,
  formatDateTimePL,
  formatHa,
  severityStyle,
} from '@/lib/ui/format';
// Lazy-load MapLibre (~250 kB gzip) — poza First Load JS, ładowany przy renderze mapy.
const FieldLayerMap = dynamic(
  () => import('@/components/dashboard/FieldLayerMap').then((m) => m.FieldLayerMap),
  { ssr: false, loading: () => <ScanLine className="h-full w-full min-h-[300px]" label="Ładowanie mapy…" /> },
);
import { BbchTracker } from '@/components/dashboard/BbchTracker';
import { FieldSettings } from '@/components/dashboard/FieldSettings';
import { HistoryChart } from '@/components/dashboard/HistoryChart';
import { ThermalBadge } from '@/components/dashboard/ThermalBadge';
import { RadarBadge } from '@/components/dashboard/RadarBadge';
import { PlanetSnapshot } from '@/components/dashboard/PlanetSnapshot';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { MultiIndexPanel } from '@/components/dashboard/MultiIndexPanel';
import { SprayTimer } from '@/components/dashboard/SprayTimer';
import { FrostAlert } from '@/components/dashboard/FrostAlert';
import { HeatAlert } from '@/components/dashboard/HeatAlert';
import { NitrogenCalculator } from '@/components/dashboard/NitrogenCalculator';
import { WaterBalance } from '@/components/dashboard/WaterBalance';
import { DiseaseRiskPanel } from '@/components/dashboard/DiseaseRiskPanel';

interface Field {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  createdAt: string;
  sowingDate: string | null;
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
  isMock?: boolean;
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
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Analiza nie powiodła się. Spróbuj ponownie.',
        );
        setRunning(false);
        return;
      }
      // Brak bezchmurnego zdjęcia (200 + status) — to NIE sukces, nie odświeżaj.
      if (data?.status === 'no_clear_imagery') {
        toast.warning(data.message ?? 'Brak bezchmurnego zdjęcia w ostatnich 14 dniach.');
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
          <div className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md">
            <Sprout className="w-3.5 h-3.5 text-signal-healthy" />
            <span className="hud-label">{cropLabel(field.crop)}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {field.name}
          </h1>
          <NdviKeyline className="mt-2 max-w-[8rem]" height={3} />
          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="font-mono tabular">{formatHa(field.areaHectares)} ha</span>
            <span className="text-border">·</span>
            <span>
              dodane <span className="font-mono tabular">{formatDatePL(field.createdAt)}</span>
            </span>
            {latest && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <Satellite className="w-3.5 h-3.5" />
                  dane z <span className="font-mono tabular">{formatDateTimePL(latest.observedAt)}</span>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-3">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={running}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-semibold bg-primary text-primary-foreground shadow-card transition-all hover:brightness-110',
              running && 'cursor-not-allowed opacity-90',
            )}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Satellite className="w-4 h-4" />}
            {running ? 'Analizuję...' : 'Uruchom analizę'}
          </button>
          <FieldSettings
            fieldId={field.id}
            initialName={field.name}
            initialCrop={field.crop}
            initialSowingDate={field.sowingDate}
          />
        </div>
      </motion.div>

      {running && <AnalysisProgress />}

      {/* Mapa pola — NA GÓRZE, obok sidebar z NDVI i tabami */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-lg overflow-hidden bg-card border border-border shadow-card"
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
          <div className="rounded-lg bg-card border border-border p-5 shadow-card">
            <div className="flex items-center gap-2 hud-label">
              <Sprout className="w-3.5 h-3.5 text-signal-healthy" />
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
              <div className="mt-4 rounded-md bg-secondary border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nie przeprowadzono jeszcze analizy. Kliknij „Uruchom analizę", aby pobrać
                aktualne dane satelitarne.
              </div>
            )}

            {seriesChronological.length >= 2 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="hud-label">Trend NDVI</span>
                  <span className="hud-label">
                    <span className="tabular">{seriesChronological.length}</span> obserwacji
                  </span>
                </div>
                <Sparkline
                  values={seriesChronological}
                  color={latest ? ndviColorHex(latest.mean) : '#16a34a'}
                  height={48}
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="rounded-lg bg-card border border-border overflow-hidden shadow-card">
            <div className="flex items-center p-1.5 m-1.5 rounded-md bg-secondary">
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

      {/* BBCH + Spray Timer — faza rozwoju + okno oprysku 72h */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
        <BbchTracker fieldId={field.id} />
        <SprayTimer fieldId={field.id} />
      </div>

      {/* Frost alert — prognoza przymrozków 10 nocy, krytyczne w kwietniu */}
      <FrostAlert fieldId={field.id} />

      {/* Heat stress — prognoza upałów 10 dni, krytyczne latem */}
      <HeatAlert fieldId={field.id} />

      {/* Kalkulator azotu — kg N/ha z NDRE + BBCH + area = zł oszczędności */}
      <NitrogenCalculator fieldId={field.id} />

      {/* Bilans wodny FAO-56 — opady vs ETc + sugestia nawodnienia */}
      <WaterBalance fieldId={field.id} />

      {/* Ryzyko chorób grzybowych — 7 modeli × BBCH + pogoda 72h */}
      <DiseaseRiskPanel fieldId={field.id} />

      {/* Historia Sentinel-2 10 lat */}
      <HistoryChart fieldId={field.id} />

      {/* Thermal Landsat + Radar Sentinel-1 + Planet — wszystkie na żądanie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ThermalBadge fieldId={field.id} />
        <RadarBadge fieldId={field.id} />
        <PlanetSnapshot fieldId={field.id} />
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
        'flex-1 px-3 py-2 rounded-md text-xs font-semibold transition',
        active
          ? 'bg-card text-primary shadow-card'
          : 'text-muted-foreground hover:text-foreground',
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
      <div className="text-sm text-muted-foreground py-4 text-center">
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
          icon={<CloudSun className="w-3.5 h-3.5 text-signal-frost" />}
        />
        <MetricMini
          label="Powierzchnia"
          value={`${formatHa(field.areaHectares)} ha`}
          icon={<Droplets className="w-3.5 h-3.5 text-signal-frost" />}
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
          isMock={latest.isMock}
        />
      )}

      <div className="rounded-md bg-secondary border border-border p-3 text-sm text-foreground">
        {describeNdvi(latest.mean, crop)}
      </div>
      <a
        href="/dashboard/agent"
        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md bg-primary text-primary-foreground text-sm hover:brightness-110 transition"
      >
        <span className="inline-flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Zapytaj agenta o to pole
        </span>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

function HistoryTab({ history }: { history: NdviPoint[] }) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
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
            className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary transition"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">
                NDVI <span className="font-mono tabular">{r.mean.toFixed(3)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                zakres <span className="font-mono tabular">{r.min.toFixed(2)}–{r.max.toFixed(2)}</span> · zachmurzenie{' '}
                <span className="font-mono tabular">{Math.round(r.cloudCover * 100)}%</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0 text-right font-mono tabular">
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
      <div className="text-sm text-muted-foreground py-4 text-center">
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
            className="rounded-md border border-border bg-card p-3 space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.pill}`}
              >
                {style.label}
              </span>
              <span className="font-medium text-foreground text-sm">{r.title}</span>
              <span className="text-[11px] text-muted-foreground ml-auto font-mono tabular">
                {formatDateTimePL(r.createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.message}</p>
            {r.action && (
              <p className="text-sm text-foreground bg-signal-healthy/10 border border-signal-healthy/25 rounded-md px-3 py-2 whitespace-pre-wrap">
                <span className="font-semibold">Do rozważenia: </span>
                {r.action}
              </p>
            )}
            {isPlantProtectionText(r.action) && <AdvisoryNotice compact />}
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
    <div className="rounded-md bg-secondary border border-border p-2.5">
      <div className="flex items-center gap-1.5 hud-label">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground font-mono tabular">{value}</div>
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
        <div className="font-mono text-5xl font-semibold tracking-tight tabular" style={{ color }}>
          {mean.toFixed(2)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{classLabel[cls]}</div>
          <div className="text-xs text-muted-foreground">
            zakres <span className="font-mono tabular">{min.toFixed(2)}–{max.toFixed(2)}</span>
          </div>
        </div>
        {trend !== null && (
          <TrendBadge delta={trend} />
        )}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{describeNdvi(mean, crop)}</p>
      <div className="text-[11px] text-muted-foreground">
        Dane z <span className="font-mono tabular">{formatDateTimePL(observedAt)}</span> · zachmurzenie{' '}
        <span className="font-mono tabular">{Math.round(cloudCover * 100)}%</span>
      </div>
    </div>
  );
}

function TrendBadge({ delta }: { delta: number }) {
  const abs = Math.abs(delta);
  if (abs < 0.01) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-secondary text-muted-foreground">
        <Minus className="w-3 h-3" />
        bez zmian
      </div>
    );
  }
  if (delta > 0) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-signal-healthy/12 text-signal-healthy">
        <ArrowUp className="w-3 h-3" />
        <span className="font-mono tabular">+{delta.toFixed(2)}</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-signal-heat/12 text-signal-heat">
      <ArrowDown className="w-3 h-3" />
      <span className="font-mono tabular">{delta.toFixed(2)}</span>
    </div>
  );
}

function AnalysisProgress() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg bg-card border border-border shadow-card p-4 flex items-center gap-4"
    >
      <NdviKeyline className="absolute inset-x-0 top-0" height={3} rounded={false} />
      <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-md bg-secondary border border-border">
        <Satellite className="w-5 h-5 text-signal-healthy" />
      </div>
      <div className="flex-1">
        <div className="font-display font-semibold tracking-tight text-foreground">Pobieram dane satelitarne</div>
        <div className="text-sm text-muted-foreground">
          Sentinel-2 NDVI + prognoza pogody + rekomendacja — to potrwa 10–30 sekund.
        </div>
        <ScanLine className="mt-2 h-1.5 w-full" />
      </div>
    </motion.div>
  );
}
