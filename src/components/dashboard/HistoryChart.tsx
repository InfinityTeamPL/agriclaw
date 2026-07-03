'use client';

// Historia NDVI pola z Sentinel-2 od 2015.
// Pokazuje miesięczny time-series + year-over-year comparison (szczyt wegetacji).
// Jeśli brak historii — przycisk "Pobierz 5 lat" uruchamia backfill z CDSE.

import { useEffect, useState } from 'react';
import { Loader2, Calendar, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { ScanLine } from '@/components/brand/ScanLine';
import { ndviColorHex } from '@/lib/design/ndvi-scale';

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
      <div className="rounded-lg bg-card border border-border shadow-card overflow-hidden">
        <NdviKeyline height={3} rounded={false} />
        <div className="p-5 space-y-3">
          <div className="hud-label">Historia pola</div>
          <ScanLine className="h-24" label="Wczytywanie serii NDVI…" />
        </div>
      </div>
    );
  }

  if (!data || data.monthly.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-border shadow-card overflow-hidden">
        <NdviKeyline height={3} rounded={false} />
        <div className="p-6 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="font-display tracking-tight font-semibold text-foreground">Brak historii pola</div>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Zobacz jak Twoje pole wyglądało przez ostatnie 5 lat — NDVI od 2020 do dziś,
            porównanie lat, identyfikacja powtarzających się słabych stref.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => runBackfill(3)}
              disabled={backfilling}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-secondary text-sm font-medium transition"
            >
              {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              3 lata
            </button>
            <button
              onClick={() => runBackfill(5)}
              disabled={backfilling}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:brightness-110 text-sm font-semibold transition"
            >
              {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              5 lat (zalecane)
            </button>
            <button
              onClick={() => runBackfill(10)}
              disabled={backfilling}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-secondary text-sm font-medium transition"
            >
              {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              10 lat (max)
            </button>
          </div>
          {backfilling && (
            <div className="hud-label mt-3 animate-pulse">
              Pobieram zdjęcia z orbity. Nie zamykaj okna...
            </div>
          )}
        </div>
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
    <div className="rounded-lg bg-card border border-border shadow-card overflow-hidden">
      <NdviKeyline height={3} rounded={false} />
      <div className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-signal-disease" />
          </div>
          <div>
            <div className="font-display tracking-tight font-semibold text-foreground">Historia pola</div>
            <div className="hud-label">
              <span className="tabular">{data.totalReadings}</span> pomiarów · <span className="tabular">{data.oldestYear} — {data.newestYear}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => runBackfill(10)}
          disabled={backfilling}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary transition"
        >
          {backfilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Uzupełnij 10 lat
        </button>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 min-w-[600px] text-muted-foreground">
          {/* Y gridlines — chrome wykresu, podąża za motywem */}
          {[0.2, 0.4, 0.6, 0.8].map((v) => (
            <g key={v}>
              <line
                x1={padding.left}
                x2={W - padding.right}
                y1={yAt(v)}
                y2={yAt(v)}
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray="2,3"
              />
              <text
                x={padding.left - 5}
                y={yAt(v) + 3}
                textAnchor="end"
                fontSize="9"
                fill="currentColor"
                fillOpacity="0.6"
                className="tabular"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area — kolor DANYCH: ciemna zieleń rampy NDVI */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            fillOpacity="0.25"
          />
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ndviColorHex(0.85)} />
              <stop offset="100%" stopColor={ndviColorHex(0.85)} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line — kolor DANYCH: rampa NDVI (zdrowa biomasa) */}
          <path d={linePath} fill="none" stroke={ndviColorHex(0.85)} strokeWidth="1.5" />

          {/* Points — kolor DANYCH: NDVI danego miesiąca */}
          {monthly.map((p, i) => (
            <circle
              key={i}
              cx={xAt(i)}
              cy={yAt(p.mean)}
              r={2.5}
              fill={ndviColorHex(p.mean)}
            >
              <title>
                {p.month}: NDVI {p.mean.toFixed(2)} (min {p.min.toFixed(2)}, max {p.max.toFixed(2)}, {p.samples} obserwacji)
              </title>
            </circle>
          ))}

          {/* Year ticks — chrome wykresu */}
          {yearTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={t.x}
                x2={t.x}
                y1={padding.top}
                y2={padding.top + ch}
                stroke="currentColor"
                strokeOpacity="0.28"
                strokeDasharray="1,2"
              />
              <text
                x={t.x}
                y={H - 10}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                fontWeight="600"
                className="tabular"
              >
                {t.year}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Year-over-year peak */}
      {data.yearly.length >= 2 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="hud-label">Szczyt wegetacji rok do roku (kwiecień–wrzesień)</div>
          <div className="flex gap-2 flex-wrap">
            {data.yearly.map((y) => (
              <div
                key={y.year}
                className="rounded-md bg-secondary border border-border px-3 py-2 min-w-[80px]"
              >
                <div className="hud-label tabular">{y.year}</div>
                <div
                  className="font-mono text-lg font-bold tabular"
                  style={{ color: ndviColorHex(y.peak) }}
                >
                  {y.peak.toFixed(2)}
                </div>
                <div className="text-[9px] font-mono tabular text-muted-foreground/70">{y.samples} obs.</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
