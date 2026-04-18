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
  surplus: { bg: 'bg-sky-500', label: 'Nadwyżka', accent: 'text-sky-700' },
  balanced: { bg: 'bg-emerald-500', label: 'Wyrównany', accent: 'text-emerald-700' },
  'mild-deficit': { bg: 'bg-amber-400', label: 'Lekki deficyt', accent: 'text-amber-700' },
  drought: { bg: 'bg-orange-500', label: 'Susza', accent: 'text-orange-700' },
  'severe-drought': { bg: 'bg-red-600', label: 'Silna susza', accent: 'text-red-700' },
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
      <div className="rounded-3xl bg-white border border-gray-200 p-5 flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        Liczę bilans wodny (FAO-56) 21 dni wstecz + 7 dni do przodu…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900">
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
        'rounded-xl border p-5 space-y-4',
        b.status === 'severe-drought' || b.status === 'drought'
          ? 'bg-white border-orange-200'
          : b.status === 'surplus'
            ? 'bg-white border-sky-200'
            : 'bg-white border-gray-200',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
              b.status === 'severe-drought' || b.status === 'drought'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : b.status === 'surplus'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : b.status === 'mild-deficit'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            )}
          >
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              Bilans wodny · {meta.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              FAO-56 · Kc {b.kcCurrent.toFixed(2)}
              {data.bbchLabel && ` · BBCH ${data.bbch} (${data.bbchLabel})`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Netto {b.periodDays} dni
          </div>
          <div className={cn('text-3xl font-bold tabular-nums', meta.accent)}>
            {b.netBalanceMm >= 0 ? '+' : ''}
            {b.netBalanceMm.toFixed(0)} mm
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<CloudRain className="w-3.5 h-3.5 text-sky-600" />}
          label="Opady"
          value={`${b.totalRainMm.toFixed(0)} mm`}
        />
        <StatCard
          icon={<CloudSun className="w-3.5 h-3.5 text-amber-600" />}
          label="ETc rośliny"
          value={`${b.totalEtcMm.toFixed(0)} mm`}
        />
        <StatCard
          icon={<Droplets className="w-3.5 h-3.5 text-emerald-600" />}
          label="Suggerowane nawod."
          value={b.irrigationSuggestionMm > 0 ? `${b.irrigationSuggestionMm} mm` : '—'}
        />
      </div>

      {/* SVG cumulative */}
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
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
          'rounded-2xl border p-3 text-sm leading-relaxed flex gap-2',
          b.status === 'severe-drought'
            ? 'bg-red-50 border-red-200 text-red-900'
            : b.status === 'drought'
              ? 'bg-orange-50 border-orange-200 text-orange-900'
              : b.status === 'mild-deficit'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-gray-50 border-gray-200 text-gray-800',
        )}
      >
        {(b.status === 'drought' || b.status === 'severe-drought') && (
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        )}
        <div>{b.recommendation}</div>
      </div>

      {/* Irrigation box */}
      {b.irrigationSuggestionMm > 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                Sugerowana dawka nawodnienia
              </div>
              <div className="text-2xl font-bold text-emerald-900 tabular-nums">
                {b.irrigationSuggestionMm} mm · {b.irrigationTotalM3.toLocaleString('pl-PL')} m³
              </div>
              <div className="text-xs text-emerald-800">
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
    <div className="rounded-2xl bg-white border border-gray-100 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}
