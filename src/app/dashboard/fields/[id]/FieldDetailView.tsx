'use client';

// Widok klienta dla szczegółów pola.
// - Mapa read-only z poligonem
// - Aktualny NDVI (duży numer + klasyfikacja)
// - Historia NDVI (sparkline SVG)
// - Historia rekomendacji
// - Przycisk "Uruchom analizę" → POST /api/analysis/[id]

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Satellite, Sprout } from 'lucide-react';
import { classifyNdvi, ndviColorHex, describeNdvi } from '@/lib/satellite/ndvi';
import { cropLabel, formatDatePL, formatDateTimePL, formatHa, severityStyle } from '@/lib/ui/format';
import { FieldPolygonMap } from '@/components/field-editor/FieldPolygonMap';

interface Field {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  createdAt: string;
}

interface NdviPoint {
  id: string;
  observedAt: string;
  mean: number;
  min: number;
  max: number;
  cloudCover: number;
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

export function FieldDetailView({ field, ndviHistory, recommendations }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const latest = ndviHistory[0];

  const handleRunAnalysis = async () => {
    if (running) return;
    setRunning(true);
    toast.info('Uruchamiam analizę satelitarną. To może potrwać 10–30 sekund.');
    try {
      const res = await fetch(`/api/analysis/${field.id}`, {
        method: 'POST',
      });
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
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
          <p className="text-sm text-gray-500">
            {cropLabel(field.crop)} · {formatHa(field.areaHectares)} ha · dodane{' '}
            {formatDatePL(field.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={running}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Satellite className="w-4 h-4" />
          )}
          {running ? 'Analizuję...' : 'Uruchom analizę'}
        </button>
      </div>

      {running && <AnalysisProgress />}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <FieldPolygonMap
          polygon={field.polygon}
          centroid={field.centroid}
          className="h-[320px] sm:h-[420px] rounded-xl overflow-hidden border border-gray-200"
        />

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sprout className="w-4 h-4 text-emerald-600" />
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
            />
          ) : (
            <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-600">
              Nie przeprowadzono jeszcze analizy. Kliknij „Uruchom analizę", aby pobrać
              aktualne dane satelitarne.
            </div>
          )}

          {ndviHistory.length >= 2 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Trend (ostatnie {ndviHistory.length})</div>
              <NdviSparkline history={ndviHistory} />
            </div>
          )}
        </div>
      </div>

      {ndviHistory.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <h2 className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">
            Historia NDVI
          </h2>
          <ul className="divide-y divide-gray-100">
            {ndviHistory.map((r) => {
              const color = ndviColorHex(r.mean);
              return (
                <li key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900 font-medium">
                      NDVI {r.mean.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500">
                      zakres {r.min.toFixed(2)}–{r.max.toFixed(2)} · zachmurzenie{' '}
                      {Math.round(r.cloudCover * 100)}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">
                    {formatDateTimePL(r.observedAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">
          Historia rekomendacji
        </h2>
        {recommendations.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            Brak rekomendacji. Uruchom analizę, aby otrzymać pierwszą.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recommendations.map((r) => {
              const style = severityStyle(r.severity);
              return (
                <li key={r.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${style.pill}`}
                    >
                      {style.label}
                    </span>
                    <span className="font-medium text-gray-900">{r.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatDateTimePL(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
                  {r.action && (
                    <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
                      <span className="font-medium">Co zrobić: </span>
                      {r.action}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
}: {
  mean: number;
  min: number;
  max: number;
  crop: string;
  observedAt: string;
  cloudCover: number;
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
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <div
          className="text-5xl font-bold tracking-tight"
          style={{ color }}
        >
          {mean.toFixed(2)}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{classLabel[cls]}</div>
          <div className="text-xs text-gray-500">
            zakres {min.toFixed(2)}–{max.toFixed(2)}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600">{describeNdvi(mean, crop)}</p>
      <div className="text-xs text-gray-500">
        Dane z {formatDateTimePL(observedAt)} · zachmurzenie{' '}
        {Math.round(cloudCover * 100)}%
      </div>
    </div>
  );
}

function NdviSparkline({ history }: { history: NdviPoint[] }) {
  // history jest DESC; odwracamy do chronologicznego
  const series = [...history].reverse();
  const width = 280;
  const height = 60;
  const paddingX = 4;
  const paddingY = 6;

  const min = 0;
  const max = 1;
  const xStep = (width - paddingX * 2) / Math.max(1, series.length - 1);
  const yScale = (v: number) =>
    paddingY + (1 - (v - min) / (max - min)) * (height - paddingY * 2);

  const points = series.map((p, i) => ({
    x: paddingX + i * xStep,
    y: yScale(p.mean),
    mean: p.mean,
  }));

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const lastColor = ndviColorHex(series[series.length - 1]?.mean ?? 0);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-16"
      role="img"
      aria-label="Trend NDVI"
    >
      <line
        x1={paddingX}
        x2={width - paddingX}
        y1={yScale(0.5)}
        y2={yScale(0.5)}
        stroke="#e5e7eb"
        strokeDasharray="2 3"
      />
      <path d={path} fill="none" stroke="#059669" strokeWidth={2} />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3 : 2}
          fill={i === points.length - 1 ? lastColor : '#059669'}
        />
      ))}
    </svg>
  );
}

function AnalysisProgress() {
  return (
    <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <Satellite className="absolute inset-0 m-auto w-4 h-4 text-emerald-600" />
      </div>
      <div className="text-sm">
        <div className="font-medium text-gray-900">Pobieram dane satelitarne</div>
        <div className="text-gray-500">
          Sentinel-2 NDVI + prognoza pogody + rekomendacja — to potrwa chwilę.
        </div>
      </div>
    </div>
  );
}
