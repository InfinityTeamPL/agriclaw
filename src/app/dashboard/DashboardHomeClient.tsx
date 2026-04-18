'use client';

// Główny widok panelu gospodarstwa — client side, bo animuje countery
// i potrzebuje framer-motion + MapLibre w dzieciach.

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Sprout,
  Satellite,
  AlertTriangle,
  Gauge,
  ArrowUpRight,
  MapPin,
  Activity,
  MessageSquare,
  CheckCircle2,
  CircleDot,
  Sparkles,
  Loader2,
  Radar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CountUp } from '@/components/dashboard/CountUp';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { PolygonThumb } from '@/components/dashboard/PolygonThumb';
import { FarmMiniMap } from '@/components/dashboard/FarmMiniMap';
import { classifyNdvi, ndviColorHex } from '@/lib/satellite/ndvi';
import { cropLabel, formatHa, formatDatePL, formatDateTimePL, severityStyle } from '@/lib/ui/format';

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
  };
  recentRecs: RecItem[];
  recentEvents: EventItem[];
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

export function DashboardHomeClient({ farm, fields, stats, recentRecs, recentEvents }: Props) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    if (scanning) return;
    setScanning(true);
    toast.info(`Skanuję ${fields.length} pól — frost, heat, choroby, bilans wodny…`);
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
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Dzisiaj na Twoim gospodarstwie
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            Dzień dobry w{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
              {farm.name}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {farm.address}
          </p>
        </div>
        <Link
          href="/dashboard/fields/new"
          className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium px-5 py-2.5 rounded-2xl shadow-[0_10px_25px_-10px_rgba(16,185,129,0.7)] hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.9)] hover:-translate-y-0.5 transition"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Dodaj pole
        </Link>
      </motion.div>

      {/* Pilne sygnały hero banner — tylko gdy są high severity */}
      {highSeverityRecs.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-3xl bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border border-red-200 ring-1 ring-red-100 p-5 shadow-[0_20px_60px_-30px_rgba(239,68,68,0.3)]"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">
                  {highSeverityRecs.length === 1
                    ? 'Pilny sygnał wymaga uwagi'
                    : `${highSeverityRecs.length} pilnych sygnałów wymaga uwagi`}
                </div>
                <div className="text-sm text-gray-600 mt-0.5">
                  Kliknij w sygnał, żeby przejść do pola.
                </div>
              </div>
            </div>
            <button
              onClick={runScan}
              disabled={scanning || fields.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              {scanning ? 'Skanuję…' : 'Skanuj wszystkie pola'}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {highSeverityRecs.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/fields/${r.fieldId}`}
                className="group rounded-2xl bg-white/80 border border-red-100 p-3 hover:bg-white hover:shadow-md transition flex items-start gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1.5 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-500 truncate">
                    {r.fieldName}
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-red-700">
                    {r.title}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {formatDateTimePL(r.createdAt)}
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600 shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skan banner — tylko gdy brak high-severity i user może skanować */}
      {highSeverityRecs.length === 0 && fields.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-3xl bg-gradient-to-br from-emerald-50 to-sky-50 border border-emerald-200 p-4 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Brak pilnych sygnałów</div>
              <div className="text-sm text-gray-500">
                Skanuj wszystkie pola żeby sprawdzić przymrozki, upały, choroby i bilans wodny.
              </div>
            </div>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            {scanning ? 'Skanuję…' : 'Skanuj pola'}
          </button>
        </motion.div>
      )}

      {/* Hero stats grid */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatTile
          icon={<Sprout className="w-4 h-4" />}
          label="Pola"
          value={<CountUp value={stats.fieldsCount} />}
          accent="emerald"
          trend={stats.fieldsCount > 0 ? 'aktywne' : 'brak'}
        />
        <StatTile
          icon={<Gauge className="w-4 h-4" />}
          label="Łącznie hektarów"
          value={<CountUp value={stats.totalHa} format={(v) => formatHa(v)} />}
          suffix="ha"
          accent="sky"
          trend="powierzchnia"
        />
        <StatTile
          icon={<Satellite className="w-4 h-4" />}
          label="Ostatnia analiza"
          valueText={stats.lastAnalysisAt ? formatDatePL(stats.lastAnalysisAt) : '—'}
          accent="violet"
          trend={stats.lastAnalysisAt ? 'satelita Sentinel-2' : 'nie uruchomiono'}
        />
        <StatTile
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Pilne sygnały"
          value={<CountUp value={stats.activeAlerts} />}
          accent={stats.activeAlerts > 0 ? 'amber' : 'emerald'}
          trend={stats.activeAlerts > 0 ? 'sprawdź pola' : 'wszystko spokojne'}
        />
      </motion.div>

      {/* Map + Activity stream */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-6">
        {/* Farm map */}
        <div className="relative rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-gray-700 border border-white">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Widok z satelity · {fields.length} {fields.length === 1 ? 'pole' : 'pól'}
          </div>
          {fields.length > 0 ? (
            <FarmMiniMap
              fields={miniMapFields}
              center={farm.center}
              className="relative w-full h-[340px] sm:h-[380px]"
            />
          ) : (
            <div className="h-[340px] sm:h-[380px] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-50 via-lime-50 to-sky-50">
              <div className="w-14 h-14 rounded-3xl bg-white/70 backdrop-blur flex items-center justify-center shadow-sm">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-center px-6">
                <div className="text-base font-medium text-gray-900">Nie narysowałeś jeszcze pól</div>
                <div className="text-sm text-gray-500 mt-1">
                  Dodaj pierwsze pole — narysuj granicę na mapie satelitarnej.
                </div>
              </div>
              <Link
                href="/dashboard/fields/new"
                className="inline-flex items-center gap-2 mt-1 bg-emerald-600 text-white font-medium px-4 py-2 rounded-2xl hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                Narysuj pierwsze pole
              </Link>
            </div>
          )}
        </div>

        {/* Activity stream */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Ostatnia aktywność</h2>
            </div>
            <Link
              href="/dashboard/agent"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Agent
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[340px] sm:max-h-[380px]">
            {recentEvents.length === 0 && recentRecs.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">
                Brak aktywności. Uruchom analizę pola, aby zobaczyć tu rekomendacje.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentRecs.slice(0, 3).map((r) => {
                  const style = severityStyle(r.severity);
                  return (
                    <li key={`rec-${r.id}`} className="px-5 py-4 hover:bg-gray-50 transition">
                      <Link href={`/dashboard/fields/${r.fieldId}`} className="block">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.pill}`}
                              >
                                {style.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateTimePL(r.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-medium text-gray-900 truncate">
                              {r.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {r.message}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1.5">
                              Pole: <span className="text-gray-600">{r.fieldName}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {recentEvents.map((e) => (
                  <li key={`evt-${e.id}`} className="px-5 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                        <EventIcon type={e.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                            {prettyEventType(e.type)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTimePL(e.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-gray-900 truncate">
                          {e.title}
                        </div>
                        {e.detail && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
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
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Twoje pola</h2>
            <p className="text-sm text-gray-500">Podgląd kondycji każdego kawałka gospodarstwa.</p>
          </div>
          {fields.length > 0 && (
            <Link
              href="/dashboard/fields"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Wszystkie pola
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-dashed border-emerald-300/60 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center mb-3">
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-gray-900 font-medium">Zacznij od pierwszego pola</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              Narysuj granicę na mapie satelitarnej — reszta (NDVI, pogoda, porady) dzieje się sama.
            </p>
            <Link
              href="/dashboard/fields/new"
              className="inline-flex items-center gap-2 mt-5 bg-emerald-600 text-white font-medium px-4 py-2 rounded-2xl hover:bg-emerald-700 transition"
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
          className="group relative block rounded-3xl bg-gradient-to-br from-gray-900 via-emerald-950 to-emerald-900 text-white overflow-hidden p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(6,78,59,0.55)] hover:shadow-[0_30px_80px_-20px_rgba(6,78,59,0.8)] transition"
        >
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-300 font-medium">
                AgroAgent
              </div>
              <div className="mt-0.5 text-lg sm:text-xl font-semibold tracking-tight">
                Zapytaj o swoje pola — odpowie w sekundę.
              </div>
              <div className="text-sm text-emerald-100/80 mt-0.5">
                „Co zrobić z polem za stodołą?" · „Kiedy siać rzepak?" · „Prognoza na ten tydzień?"
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-gray-900 font-medium group-hover:bg-emerald-50 transition">
              Otwórz czat
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

type AccentColor = 'emerald' | 'sky' | 'amber' | 'violet';

const accentTokens: Record<AccentColor, { grad: string; icon: string; trend: string }> = {
  emerald: {
    grad: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    icon: 'bg-emerald-100 text-emerald-700',
    trend: 'text-emerald-700',
  },
  sky: {
    grad: 'from-sky-500/15 via-sky-500/5 to-transparent',
    icon: 'bg-sky-100 text-sky-700',
    trend: 'text-sky-700',
  },
  amber: {
    grad: 'from-amber-500/15 via-amber-500/5 to-transparent',
    icon: 'bg-amber-100 text-amber-700',
    trend: 'text-amber-700',
  },
  violet: {
    grad: 'from-violet-500/15 via-violet-500/5 to-transparent',
    icon: 'bg-violet-100 text-violet-700',
    trend: 'text-violet-700',
  },
};

function StatTile({
  icon,
  label,
  value,
  valueText,
  suffix,
  accent,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  valueText?: string;
  suffix?: string;
  accent: AccentColor;
  trend?: string;
}) {
  const tokens = accentTokens[accent];
  return (
    <div className="relative rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 p-4 sm:p-5 overflow-hidden group hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.3)]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tokens.grad} opacity-60 group-hover:opacity-100 transition-opacity`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 flex items-baseline gap-1">
            {value ?? <span>{valueText}</span>}
            {suffix && <span className="text-sm text-gray-400 font-normal">{suffix}</span>}
          </div>
          {trend && (
            <div className={`text-[11px] font-medium mt-1 ${tokens.trend}`}>{trend}</div>
          )}
        </div>
        <div className={`w-9 h-9 rounded-2xl ${tokens.icon} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

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
      className="group relative block rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 overflow-hidden hover:-translate-y-1 hover:shadow-2xl shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)] transition-all duration-300"
    >
      {/* Header with polygon thumb */}
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${ndviColor}22 0%, ${ndviColor}08 60%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <PolygonThumb
            polygon={field.polygon}
            color={ndviColor}
            className="w-32 h-24 drop-shadow-sm"
          />
        </div>
        {/* NDVI pill top-right */}
        <div className="absolute top-3 right-3">
          {field.ndviMean !== null ? (
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur border"
              style={{ borderColor: `${ndviColor}55`, color: '#0f172a' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ndviColor }} />
              NDVI {field.ndviMean.toFixed(2)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/95 backdrop-blur border border-gray-200 text-gray-500">
              Brak analizy
            </div>
          )}
        </div>
        {/* Crop pill top-left */}
        <div className="absolute top-3 left-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/95 backdrop-blur border border-white text-gray-700">
            <Sprout className="w-3 h-3 text-emerald-600" />
            {cropLabel(field.crop)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 tracking-tight truncate group-hover:text-emerald-700 transition">
              {field.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatHa(field.areaHectares)} ha
              {cls && ` · ${classLabel[cls] ?? ''}`}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Sparkline */}
        {field.ndviSeries.length >= 2 ? (
          <div className="mt-3">
            <Sparkline values={field.ndviSeries} color={ndviColor} height={32} />
            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
              <span>trend z {field.ndviSeries.length} obserwacji</span>
              <span>{field.ndviObservedAt ? formatDatePL(field.ndviObservedAt) : ''}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-gray-400 py-2 border-t border-gray-100">
            {field.ndviObservedAt
              ? `Jedna obserwacja · ${formatDatePL(field.ndviObservedAt)}`
              : 'Uruchom analizę, aby zebrać pierwsze dane.'}
          </div>
        )}
      </div>
    </Link>
  );
}

function EventIcon({ type }: { type: string }) {
  if (type.startsWith('ndvi') || type.startsWith('analysis')) {
    return <Satellite className="w-4 h-4 text-sky-700" />;
  }
  if (type.includes('alert') || type.includes('error')) {
    return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  }
  if (type.includes('deployed') || type.includes('ready')) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  }
  return <CircleDot className="w-4 h-4 text-sky-700" />;
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
