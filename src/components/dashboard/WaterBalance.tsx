'use client';

// Bilans wodny pola (FAO-56) — ile rośłina zużywa vs ile dostaje z deszczu.
// Pokazuje wykres dzień-po-dniu i sugestię nawodnienia w mm + m³/ha.

import { useEffect, useState } from 'react';
import { Loader2, Droplets, CloudRain, CloudSun, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'surplus' | 'balanced' | 'mild-deficit' | 'drought' | 'severe-drought';

interface DailyBalance {
  date: string;
  rainMm: number;
  et0Mm: number;
  kc: number;
  etcMm: number;
  balanceMm: number;
  cumulativeMm: number;
}

interface WbResponse {
  fieldId: string;
  fieldName: string;
  crop: string;
  bbch: number | null;
  bbchLabel: string | null;
  areaHectares: number;
  balance: {
    crop: string;
    bbch: number;
    kcCurrent: number;
    periodDays: number;
    totalRainMm: number;
    totalEtcMm: number;
    netBalanceMm: number;
    daily: DailyBalance[];
    status: Status;
    irrigationSuggestionMm: number;
    irrigationTotalM3: number;
    recommendation: string;
  };
}

interface Props {
  fieldId: string;
}

const statusMeta: Record<Status, { bg: string; label: string; accent: string }> = {
  surplus: { bg: 'bg-signal-frost', label: 'Nadwyżka', accent: 'text-signal-frost' },
  balanced: { bg: 'bg-signal-healthy', label: 'Wyrównany', accent: 'text-signal-healthy' },
  'mild-deficit': { bg: 'bg-signal-heat', label: 'Lekki deficyt', accent: 'text-signal-heat' },
  drought: { bg: 'bg-signal-heat', label: 'Susza', accent: 'text-signal-heat' },
  'severe-drought': { bg: 'bg-signal-drought', label: 'Silna susza', accent: 'text-signal-drought' },
};

export function WaterBalance({ fieldId }: Props) {
  const [data, setData] = useState<WbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/fields/${fieldId}/water-balance`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<WbResponse>;
      })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(String(e.message ?? e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fieldId]);

  if (loading) {
    return (
      <div className="rounded-lg bg-card border border-border shadow-card p-5 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-signal-frost" />
        Liczę bilans wodny (FAO-56) 21 dni wstecz + 7 dni do przodu…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-signal-frost/10 border border-signal-frost/30 p-4 text-sm text-signal-frost">
        Bilans wodny niedostępny: {error}
      </div>
    );
  }

  if (!data) return null;

  const b = data.balance;
  const meta = statusMeta[b.status];
  const cumMax = Math.max(0, ...b.daily.map((d) => d.cumulativeMm));
  const cumMin = Math.min(0, ...b.daily.map((d) => d.cumulativeMm));
  const cumRange = Math.max(1, cumMax - cumMin);

  // SVG dimensions
  const svgW = 560;
  const svgH = 120;
  const mid = svgH / 2;
  const padX = 8;
  const innerW = svgW - padX * 2;
  const stepX = innerW / Math.max(1, b.daily.length - 1);

  const path = b.daily
    .map((d, i) => {
      const x = padX + i * stepX;
      const y = mid - (d.cumulativeMm / cumRange) * (svgH / 2 - 8);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Area fill path
  const lastX = padX + (b.daily.length - 1) * stepX;
  const areaPath = `${path} L ${lastX.toFixed(1)} ${mid} L ${padX} ${mid} Z`;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card shadow-card p-5 space-y-4',
        b.status === 'severe-drought' || b.status === 'drought'
          ? 'border-signal-drought/30'
          : b.status === 'surplus'
            ? 'border-signal-frost/30'
            : 'border-border',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center shrink-0 border',
              b.status === 'severe-drought' || b.status === 'drought'
                ? 'bg-signal-drought/10 text-signal-drought border-signal-drought/30'
                : b.status === 'surplus'
                  ? 'bg-signal-frost/10 text-signal-frost border-signal-frost/30'
                  : b.status === 'mild-deficit'
                    ? 'bg-signal-heat/10 text-signal-heat border-signal-heat/30'
                    : 'bg-signal-healthy/10 text-signal-healthy border-signal-healthy/30',
            )}
          >
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              Bilans wodny · {meta.label}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              FAO-56 · Kc {b.kcCurrent.toFixed(2)}
              {data.bbchLabel && ` · BBCH ${data.bbch} (${data.bbchLabel})`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="hud-label">
            Netto {b.periodDays} dni
          </div>
          <div className={cn('text-3xl font-bold font-mono tabular', meta.accent)}>
            {b.netBalanceMm >= 0 ? '+' : ''}
            {b.netBalanceMm.toFixed(0)} mm
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<CloudRain className="w-3.5 h-3.5 text-signal-frost" />}
          label="Opady"
          value={`${b.totalRainMm.toFixed(0)} mm`}
        />
        <StatCard
          icon={<CloudSun className="w-3.5 h-3.5 text-signal-heat" />}
          label="ETc rośliny"
          value={`${b.totalEtcMm.toFixed(0)} mm`}
        />
        <StatCard
          icon={<Droplets className="w-3.5 h-3.5 text-signal-healthy" />}
          label="Suggerowane nawod."
          value={b.irrigationSuggestionMm > 0 ? `${b.irrigationSuggestionMm} mm` : '—'}
        />
      </div>

      {/* SVG cumulative */}
      <div className="rounded-lg bg-secondary border border-border p-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Skumulowany bilans dzień-po-dniu</span>
          <span className="font-mono">
            {b.daily[0]?.date.slice(5)} → {b.daily[b.daily.length - 1]?.date.slice(5)}
          </span>
        </div>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-20">
          {/* Zero line */}
          <line
            x1={padX}
            y1={mid}
            x2={svgW - padX}
            y2={mid}
            stroke="#d1d5db"
            strokeDasharray="2 3"
          />
          {/* Area */}
          <path
            d={areaPath}
            fill={b.netBalanceMm >= 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(220, 38, 38, 0.15)'}
          />
          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={b.netBalanceMm >= 0 ? '#059669' : '#dc2626'}
            strokeWidth="2"
          />
          {/* Today marker — separating history from forecast */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayIdx = b.daily.findIndex((d) => d.date === todayStr);
            if (todayIdx < 0) return null;
            const xToday = padX + todayIdx * stepX;
            return (
              <g>
                <line
                  x1={xToday}
                  y1={6}
                  x2={xToday}
                  y2={svgH - 6}
                  stroke="#9ca3af"
                  strokeDasharray="3 2"
                  strokeWidth="1"
                />
                <text x={xToday + 3} y={14} fontSize="9" fill="#6b7280">dziś</text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Rekomendacja */}
      <div
        className={cn(
          'rounded-lg border p-3 text-sm leading-relaxed flex gap-2',
          b.status === 'severe-drought'
            ? 'bg-signal-drought/10 border-signal-drought/30 text-signal-drought'
            : b.status === 'drought'
              ? 'bg-signal-heat/10 border-signal-heat/30 text-signal-heat'
              : b.status === 'mild-deficit'
                ? 'bg-signal-heat/10 border-signal-heat/30 text-signal-heat'
                : 'bg-secondary border-border text-foreground',
        )}
      >
        {(b.status === 'drought' || b.status === 'severe-drought') && (
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        )}
        <div>{b.recommendation}</div>
      </div>

      {/* Irrigation box */}
      {b.irrigationSuggestionMm > 0 && (
        <div className="rounded-lg bg-signal-healthy/10 border border-signal-healthy/30 p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-signal-healthy font-semibold">
                Sugerowana dawka nawodnienia
              </div>
              <div className="text-2xl font-bold text-signal-healthy font-mono tabular">
                {b.irrigationSuggestionMm} mm · {b.irrigationTotalM3.toLocaleString('pl-PL')} m³
              </div>
              <div className="text-xs text-signal-healthy">
                Na polu {data.areaHectares.toFixed(1)} ha · najlepsza pora: wieczór 18-21 lub rano 4-7
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-card border border-border p-2.5">
      <div className="hud-label flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-foreground font-mono tabular">{value}</div>
    </div>
  );
}
