'use client';

// Główny widok panelu gospodarstwa — client side, bo animuje countery
// i potrzebuje framer-motion + MapLibre w dzieciach.

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Sprout,
  Satellite,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  Activity,
  MessageSquare,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { FieldSatThumb } from '@/components/dashboard/FieldSatThumb';
import { TodayBriefing, type AttentionItem, type TodayWeather } from '@/components/dashboard/TodayBriefing';
// Lazy-load MapLibre (~250 kB gzip) — poza First Load JS panelu, ładowany dopiero
// przy renderze mapy. Audyt: perf (maplibre statycznie w bundlu dashboardu).
const FarmMiniMap = dynamic(
  () => import('@/components/dashboard/FarmMiniMap').then((m) => m.FarmMiniMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-secondary" /> },
);
import { classifyNdvi } from '@/lib/satellite/ndvi';
import { ndviColorHex } from '@/lib/design/ndvi-scale';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { cropLabel, formatHa, formatDatePL, formatDateTimePL, severityStyle, pluralPL } from '@/lib/ui/format';

interface FieldItem {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  createdAt: string;
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  ndviMean: number | null;
  ndviObservedAt: string | null;
  ndviSeries: number[];
}

interface RecItem {
  id: string;
  fieldId: string;
  fieldName: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
}

interface EventItem {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  createdAt: string;
}

interface Props {
  farm: { id: string; name: string; address: string; center: { lat: number; lon: number } };
  fields: FieldItem[];
  stats: {
    fieldsCount: number;
    totalHa: number;
    activeAlerts: number;
    lastAnalysisAt: string | null;
    complianceScore: number | null;
    complianceFails: number;
    complianceWarns: number;
  };
  recentRecs: RecItem[];
  recentEvents: EventItem[];
  attention: AttentionItem[];
  weather: TodayWeather | null;
  sprayWindow: { label: string; quality: string } | null;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function DashboardHomeClient({ farm, fields, stats, recentRecs, recentEvents, attention, weather, sprayWindow }: Props) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    if (scanning) return;
    setScanning(true);
    toast.info(`Skanuję ${fields.length} ${pluralPL(fields.length, 'pole', 'pola', 'pól')} — przymrozki, upały, choroby, bilans wodny…`);
    try {
      const res = await fetch('/api/alerts/scan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Skan nie powiódł się');
        return;
      }
      if (data.newRecommendations > 0) {
        toast.success(`Skan ukończony · ${data.newRecommendations} nowych sygnałów`);
      } else {
        toast.success('Skan ukończony · brak nowych zagrożeń');
      }
      router.refresh();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setScanning(false);
    }
  };

  const highSeverityRecs = recentRecs.filter((r) => r.severity === 'high');

  const miniMapFields = fields.map((f) => ({
    id: f.id,
    name: f.name,
    polygon: f.polygon,
    ndviMean: f.ndviMean,
  }));

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8"
    >
      {/* Dziś — stan gospodarstwa, co zrobić, pogoda i okno oprysku */}
      <motion.div variants={item}>
        <TodayBriefing
          farmName={farm.name}
          address={farm.address}
          attention={attention}
          attentionTotal={stats.activeAlerts}
          weather={weather}
          sprayWindow={sprayWindow}
          stats={{
            fieldsCount: stats.fieldsCount,
            totalHa: stats.totalHa,
            lastAnalysisAt: stats.lastAnalysisAt,
            complianceScore: stats.complianceScore,
          }}
          scanning={scanning}
          onScan={runScan}
        />
      </motion.div>

      {/* Map + Activity stream */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-6">
        {/* Farm map */}
        <div className="relative rounded-lg overflow-hidden bg-card border border-border shadow-card">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/95 border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-signal-healthy animate-pulse" />
            <span className="hud-label">Widok z satelity · {fields.length} {pluralPL(fields.length, 'pole', 'pola', 'pól')}</span>
          </div>
          {fields.length > 0 ? (
            <FarmMiniMap
              fields={miniMapFields}
              center={farm.center}
              className="relative w-full h-[340px] sm:h-[380px]"
            />
          ) : (
            <div className="h-[340px] sm:h-[380px] flex flex-col items-center justify-center gap-3 cadastral-grid">
              <div className="w-14 h-14 rounded-md bg-card border border-border flex items-center justify-center shadow-card">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center px-6">
                <div className="text-base font-medium text-foreground">Nie narysowałeś jeszcze pól</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Dodaj pierwsze pole — narysuj granicę na mapie satelitarnej.
                </div>
              </div>
              <Link
                href="/dashboard/fields/new"
                className="inline-flex items-center gap-2 mt-1 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" />
                Narysuj pierwsze pole
              </Link>
            </div>
          )}
        </div>

        {/* Activity stream */}
        <div className="rounded-lg bg-card border border-border shadow-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">Ostatnia aktywność</h2>
            </div>
            <Link
              href="/dashboard/agent"
              className="text-xs font-medium text-primary hover:brightness-110 inline-flex items-center gap-1"
            >
              Agent
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[340px] sm:max-h-[380px]">
            {recentEvents.length === 0 && recentRecs.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Brak aktywności. Uruchom analizę pola, aby zobaczyć tu rekomendacje.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentRecs.slice(0, 3).map((r) => {
                  const style = severityStyle(r.severity);
                  return (
                    <li key={`rec-${r.id}`} className="px-5 py-4 hover:bg-secondary transition">
                      <Link href={`/dashboard/fields/${r.fieldId}`} className="block">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-md bg-signal-healthy/10 border border-signal-healthy/30 flex items-center justify-center shrink-0">
                            <Satellite className="w-4 h-4 text-signal-healthy" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.pill}`}
                              >
                                {style.label}
                              </span>
                              <span className="font-mono tabular text-[10px] text-muted-foreground">
                                {formatDateTimePL(r.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-medium text-foreground truncate">
                              {r.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {r.message}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1.5">
                              Pole: <span className="text-foreground">{r.fieldName}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {recentEvents.map((e) => (
                  <li key={`evt-${e.id}`} className="px-5 py-4 hover:bg-secondary transition">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center shrink-0">
                        <EventIcon type={e.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="hud-label">
                            {prettyEventType(e.type)}
                          </span>
                          <span className="font-mono tabular text-[10px] text-muted-foreground">
                            {formatDateTimePL(e.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-foreground truncate">
                          {e.title}
                        </div>
                        {e.detail && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {e.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fields grid */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Twoje pola</h2>
            <p className="text-sm text-muted-foreground">Podgląd kondycji każdego kawałka gospodarstwa.</p>
          </div>
          {fields.length > 0 && (
            <Link
              href="/dashboard/fields"
              className="text-sm font-medium text-primary hover:brightness-110 inline-flex items-center gap-1"
            >
              Wszystkie pola
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg bg-card border border-dashed border-border p-10 text-center">
            <div className="w-12 h-12 rounded-md bg-signal-healthy/10 border border-signal-healthy/30 mx-auto flex items-center justify-center mb-3">
              <Sprout className="w-5 h-5 text-signal-healthy" />
            </div>
            <p className="text-foreground font-medium">Zacznij od pierwszego pola</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Narysuj granicę na mapie satelitarnej — reszta (NDVI, pogoda, porady) dzieje się sama.
            </p>
            <Link
              href="/dashboard/fields/new"
              className="inline-flex items-center gap-2 mt-5 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:brightness-110 transition"
            >
              <Plus className="w-4 h-4" />
              Dodaj pierwsze pole
            </Link>
          </div>
        ) : (
          <motion.div
            variants={container}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {fields.map((f) => (
              <motion.div key={f.id} variants={item}>
                <FieldCard field={f} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* Chat CTA */}
      <motion.div variants={item}>
        <Link
          href="/dashboard/agent"
          className="group relative block rounded-lg bg-secondary border border-border overflow-hidden p-6 sm:p-8 shadow-card hover:shadow-pop transition"
        >
          {/* Rampa NDVI jako sygnatura marki na górnej krawędzi */}
          <NdviKeyline className="absolute top-0 left-0" rounded={false} height={3} />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-md bg-card border border-border flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="hud-label">
                AgroAgent
              </div>
              <div className="mt-0.5 font-display text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Zapytaj o swoje pola — odpowie w sekundę.
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                „Co zrobić z polem za stodołą?" · „Kiedy siać rzepak?" · „Prognoza na ten tydzień?"
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold group-hover:brightness-110 transition">
              Otwórz czat
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

type AccentColor = 'healthy' | 'frost' | 'heat' | 'drought' | 'neutral';

const accentTokens: Record<AccentColor, { icon: string; trend: string }> = {
  healthy: {
    icon: 'bg-signal-healthy/10 text-signal-healthy',
    trend: 'text-signal-healthy',
  },
  frost: {
    icon: 'bg-signal-frost/10 text-signal-frost',
    trend: 'text-signal-frost',
  },
  heat: {
    icon: 'bg-signal-heat/10 text-signal-heat',
    trend: 'text-signal-heat',
  },
  drought: {
    icon: 'bg-signal-drought/10 text-signal-drought',
    trend: 'text-signal-drought',
  },
  neutral: {
    icon: 'bg-secondary text-muted-foreground',
    trend: 'text-muted-foreground',
  },
};

function FieldCard({ field }: { field: FieldItem }) {
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
      {/* Header with polygon thumb */}
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${ndviColor}22 0%, ${ndviColor}08 60%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <FieldSatThumb
            fieldId={field.id}
            version={field.ndviObservedAt}
            polygon={field.polygon}
            fallbackColor={ndviColor}
            className="w-36 h-24"
          />
        </div>
        {/* NDVI pill top-right */}
        <div className="absolute top-3 right-3">
          {field.ndviMean !== null ? (
            <div
              className="inline-flex items-center gap-1.5 font-mono tabular text-[11px] font-semibold px-2.5 py-1 rounded-md bg-card border"
              style={{ borderColor: `${ndviColor}55`, color: 'hsl(var(--foreground))' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ndviColor }} />
              NDVI {field.ndviMean.toFixed(2)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-card border border-border text-muted-foreground">
              Brak analizy
            </div>
          )}
        </div>
        {/* Crop pill top-left */}
        <div className="absolute top-3 left-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-card border border-border text-foreground">
            <Sprout className="w-3 h-3 text-signal-healthy" />
            {cropLabel(field.crop)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-foreground tracking-tight truncate group-hover:text-primary transition">
              {field.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono tabular">{formatHa(field.areaHectares)}</span> ha
              {cls && ` · ${classLabel[cls] ?? ''}`}
            </div>
          </div>
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Sparkline */}
        {field.ndviSeries.length >= 2 ? (
          <div className="mt-3">
            <Sparkline values={field.ndviSeries} color={ndviColor} height={32} />
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>trend z <span className="font-mono tabular">{field.ndviSeries.length}</span> obserwacji</span>
              <span className="font-mono tabular">{field.ndviObservedAt ? formatDatePL(field.ndviObservedAt) : ''}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-muted-foreground py-2 border-t border-border">
            {field.ndviObservedAt
              ? <>Jedna obserwacja · <span className="font-mono tabular">{formatDatePL(field.ndviObservedAt)}</span></>
              : 'Uruchom analizę, aby zebrać pierwsze dane.'}
          </div>
        )}
      </div>
    </Link>
  );
}

function EventIcon({ type }: { type: string }) {
  if (type.startsWith('ndvi') || type.startsWith('analysis')) {
    return <Satellite className="w-4 h-4 text-signal-frost" />;
  }
  if (type.includes('alert') || type.includes('error')) {
    return <AlertTriangle className="w-4 h-4 text-signal-heat" />;
  }
  if (type.includes('deployed') || type.includes('ready')) {
    return <CheckCircle2 className="w-4 h-4 text-signal-healthy" />;
  }
  return <CircleDot className="w-4 h-4 text-muted-foreground" />;
}

function prettyEventType(type: string): string {
  const map: Record<string, string> = {
    'agent.deployed': 'Agent gotowy',
    'agent.ready': 'Agent online',
    'ndvi.alert': 'Alert NDVI',
    'ndvi.reading': 'Odczyt NDVI',
    'analysis.completed': 'Analiza',
    'whatsapp.sent': 'WhatsApp',
    'field.created': 'Nowe pole',
  };
  return map[type] ?? type.replace(/\./g, ' · ');
}
