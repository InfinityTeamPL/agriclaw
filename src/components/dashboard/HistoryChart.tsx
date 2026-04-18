'use client';

// Historia NDVI pola z Sentinel-2 od 2015.
// Pokazuje miesięczny time-series + year-over-year comparison (szczyt wegetacji).
// Jeśli brak historii — przycisk "Pobierz 5 lat" uruchamia backfill z CDSE.

import { useEffect, useState } from 'react';
import { Loader2, Calendar, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MonthlyPoint {
  month: string; // YYYY-MM
  mean: number;
  max: number;
  min: number;
  samples: number;
}

interface YearlyPoint {
  year: string;
  peak: number;
  avg: number;
  samples: number;
}

interface HistoryResponse {
  fieldId: string;
  totalReadings: number;
  monthly: MonthlyPoint[];
  yearly: YearlyPoint[];
  oldestYear: string | null;
  newestYear: string | null;
  needsBackfill: boolean;
}

function ndviColor(v: number): string {
  if (v < 0.2) return '#7f1d1d';
  if (v < 0.35) return '#dc2626';
  if (v < 0.55) return '#f97316';
  if (v < 0.7) return '#84cc16';
  return '#14532d';
}

export function HistoryChart({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/fields/${fieldId}/history`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [fieldId]);

  const runBackfill = async (years: number) => {
    if (backfilling) return;
    setBackfilling(true);
    toast.info(`Pobieram ${years} lat historii z Sentinel-2. To może potrwać 2-3 min.`);
    try {
      const res = await fetch(`/api/fields/${fieldId}/history/backfill?years=${years}`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? 'Backfill nie powiodł się');
        return;
      }
      toast.success(
        `Pobrano ${result.processed}/${result.monthsChecked} miesięcy historii.`,
      );
      load();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setBackfilling(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-gray-200 p-5 animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data || data.monthly.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-gray-200 p-6 text-center">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <div className="font-semibold text-gray-900">Brak historii pola</div>
        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
          Zobacz jak Twoje pole wyglądało przez ostatnie 5 lat — NDVI od 2020 do dziś,
          porównanie lat, identyfikacja powtarzających się słabych stref.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => runBackfill(3)}
            disabled={backfilling}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-medium transition"
          >
            {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            3 lata
          </button>
          <button
            onClick={() => runBackfill(5)}
            disabled={backfilling}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold transition"
          >
            {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            5 lat (zalecane)
          </button>
          <button
            onClick={() => runBackfill(10)}
            disabled={backfilling}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-medium transition"
          >
            {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            10 lat (max)
          </button>
        </div>
        {backfilling && (
          <div className="text-xs text-gray-500 mt-3 animate-pulse">
            Pobieram zdjęcia z orbity. Nie zamykaj okna...
          </div>
        )}
      </div>
    );
  }

  // Chart dimensions
  const W = 800;
  const H = 200;
  const padding = { top: 10, right: 20, bottom: 30, left: 30 };
  const cw = W - padding.left - padding.right;
  const ch = H - padding.top - padding.bottom;

  const monthly = data.monthly;
  const minVal = 0;
  const maxVal = 1;
  const xStep = cw / Math.max(1, monthly.length - 1);

  const xAt = (i: number) => padding.left + i * xStep;
  const yAt = (v: number) => padding.top + (1 - (v - minVal) / (maxVal - minVal)) * ch;

  const linePath = monthly
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(p.mean).toFixed(1)}`)
    .join(' ');

  // Area pod linią
  const areaPath =
    linePath +
    ` L${xAt(monthly.length - 1).toFixed(1)} ${padding.top + ch}` +
    ` L${xAt(0).toFixed(1)} ${padding.top + ch} Z`;

  // Year ticks
  const yearTicks: { x: number; year: string }[] = [];
  let lastYear = '';
  monthly.forEach((p, i) => {
    const year = p.month.slice(0, 4);
    if (year !== lastYear) {
      yearTicks.push({ x: xAt(i), year });
      lastYear = year;
    }
  });

  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-50 ring-1 ring-violet-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Historia pola</div>
            <div className="text-xs text-gray-500">
              {data.totalReadings} pomiarów · {data.oldestYear} — {data.newestYear}
            </div>
          </div>
        </div>
        <button
          onClick={() => runBackfill(10)}
          disabled={backfilling}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          {backfilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Uzupełnij 10 lat
        </button>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 min-w-[600px]">
          {/* Y gridlines */}
          {[0.2, 0.4, 0.6, 0.8].map((v) => (
            <g key={v}>
              <line
                x1={padding.left}
                x2={W - padding.right}
                y1={yAt(v)}
                y2={yAt(v)}
                stroke="#e5e7eb"
                strokeDasharray="2,3"
              />
              <text
                x={padding.left - 5}
                y={yAt(v) + 3}
                textAnchor="end"
                fontSize="9"
                fill="#9ca3af"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            fillOpacity="0.25"
          />
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={linePath} fill="none" stroke="#14532d" strokeWidth="1.5" />

          {/* Points */}
          {monthly.map((p, i) => (
            <circle
              key={i}
              cx={xAt(i)}
              cy={yAt(p.mean)}
              r={2.5}
              fill={ndviColor(p.mean)}
            >
              <title>
                {p.month}: NDVI {p.mean.toFixed(2)} (min {p.min.toFixed(2)}, max {p.max.toFixed(2)}, {p.samples} obserwacji)
              </title>
            </circle>
          ))}

          {/* Year ticks */}
          {yearTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={t.x}
                x2={t.x}
                y1={padding.top}
                y2={padding.top + ch}
                stroke="#d1d5db"
                strokeDasharray="1,2"
              />
              <text
                x={t.x}
                y={H - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
                fontWeight="600"
              >
                {t.year}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Year-over-year peak */}
      {data.yearly.length >= 2 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-700">Szczyt wegetacji rok do roku (kwiecień–wrzesień)</div>
          <div className="flex gap-2 flex-wrap">
            {data.yearly.map((y) => (
              <div
                key={y.year}
                className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 min-w-[80px]"
              >
                <div className="text-[10px] text-gray-500 font-mono">{y.year}</div>
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{ color: ndviColor(y.peak) }}
                >
                  {y.peak.toFixed(2)}
                </div>
                <div className="text-[9px] text-gray-400">{y.samples} obs.</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
