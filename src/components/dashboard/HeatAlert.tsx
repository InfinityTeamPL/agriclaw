'use client';

// Heat Alert — prognoza stresu cieplnego na najbliższe 10 dni.
// Komplement do FrostAlert. Kluczowe dla lata (czerwiec-sierpień).
// W kwietniu zazwyczaj się nie pokazuje (auto-hide).

import { useEffect, useState } from 'react';
import { Flame, AlertTriangle, Thermometer, ShieldCheck, Loader2, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeatLevel = 'safe' | 'watch' | 'warning' | 'critical';

interface HeatDay {
  date: string;
  tMax: number;
  level: HeatLevel;
  headline: string;
}

interface HeatResponse {
  fieldId: string;
  crop: string;
  bbch: number;
  bbchLabel: string;
  sensitivityPhase: string;
  stressThreshold: number;
  criticalThreshold: number;
  worstLevel: HeatLevel;
  maxTempC: number;
  consecutiveStressDays: number;
  firstDangerDate: string | null;
  days: HeatDay[];
  recommendation: string;
}

interface Props {
  fieldId: string;
}

const levelBg: Record<HeatLevel, string> = {
  safe: 'bg-emerald-500',
  watch: 'bg-amber-300',
  warning: 'bg-orange-500',
  critical: 'bg-red-600',
};

const levelBgSoft: Record<HeatLevel, string> = {
  safe: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  watch: 'bg-amber-50 text-amber-900 border-amber-200',
  warning: 'bg-orange-50 text-orange-900 border-orange-200',
  critical: 'bg-red-50 text-red-900 border-red-200',
};

const levelIcon: Record<HeatLevel, typeof Flame> = {
  safe: ShieldCheck,
  watch: Sun,
  warning: AlertTriangle,
  critical: Flame,
};

const levelLabel: Record<HeatLevel, string> = {
  safe: 'Bezpiecznie',
  watch: 'Ciepło',
  warning: 'Stres cieplny',
  critical: 'Krytyczny upał',
};

function dayLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  if (iso === today) return 'Dziś';
  if (iso === tomorrow) return 'Jutro';
  return new Date(iso).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' });
}

export function HeatAlert({ fieldId }: Props) {
  const [data, setData] = useState<HeatResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/fields/${fieldId}/heat`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<HeatResponse>;
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

  if (loading) return null;
  if (error) return null; // cichy fallback — heat nie zawsze musi być widoczny
  if (!data) return null;

  // Auto-hide gdy nic interesującego — nawet watch zachowamy tylko gdy temp wysoka
  const hasInteresting =
    data.worstLevel === 'warning' ||
    data.worstLevel === 'critical' ||
    data.maxTempC >= data.stressThreshold - 2;
  if (!hasInteresting) return null;

  const Icon = levelIcon[data.worstLevel];

  return (
    <div
      className={cn(
        'rounded-3xl border p-5 space-y-4 transition',
        data.worstLevel === 'critical'
          ? 'bg-gradient-to-br from-red-50 to-white border-red-200 ring-1 ring-red-100'
          : data.worstLevel === 'warning'
            ? 'bg-gradient-to-br from-orange-50 to-white border-orange-200 ring-1 ring-orange-100'
            : 'bg-white border-gray-200',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              data.worstLevel === 'critical'
                ? 'bg-red-600 text-white'
                : data.worstLevel === 'warning'
                  ? 'bg-orange-500 text-white'
                  : 'bg-amber-100 text-amber-700',
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {data.worstLevel === 'critical'
                ? 'Krytyczny stres cieplny'
                : data.worstLevel === 'warning'
                  ? 'Stres cieplny'
                  : 'Upalne dni — obserwuj'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Faza: {data.sensitivityPhase} · próg {data.stressThreshold}°C
              {data.consecutiveStressDays >= 2 && ` · ${data.consecutiveStressDays} dni pod rząd`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Maksimum
          </div>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums',
              data.maxTempC >= data.criticalThreshold
                ? 'text-red-700'
                : data.maxTempC >= data.stressThreshold
                  ? 'text-orange-700'
                  : 'text-amber-700',
            )}
          >
            {data.maxTempC.toFixed(0)}°C
          </div>
        </div>
      </div>

      {/* 10-dniowa prognoza */}
      <div>
        <div className="flex items-center gap-1">
          {data.days.map((d) => (
            <div
              key={d.date}
              title={`${dayLabel(d.date)} · ${d.headline}`}
              className={cn(
                'flex-1 h-9 rounded-md relative cursor-pointer transition hover:scale-y-110',
                levelBg[d.level],
              )}
              style={{ opacity: 0.85 }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[9px] font-semibold leading-tight">
                <div>{new Date(d.date).getDate()}</div>
                <div className="font-mono tabular-nums">{d.tMax.toFixed(0)}°</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5 font-mono">
          <span>{dayLabel(data.days[0]?.date ?? '')}</span>
          <span>{dayLabel(data.days[data.days.length - 1]?.date ?? '')}</span>
        </div>
      </div>

      {/* Rekomendacja */}
      {(data.worstLevel === 'warning' || data.worstLevel === 'critical') && (
        <div
          className={cn(
            'rounded-2xl border p-3 text-sm leading-relaxed',
            levelBgSoft[data.worstLevel],
          )}
        >
          {data.recommendation}
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap pt-1 border-t border-gray-100">
        {(['critical', 'warning', 'watch', 'safe'] as const).map((l) => (
          <div key={l} className="inline-flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-sm', levelBg[l])} />
            <span>{levelLabel[l]}</span>
          </div>
        ))}
        <span className="inline-flex items-center gap-1 text-gray-400 ml-auto">
          <Thermometer className="w-3 h-3" />
          Open-Meteo · 10 dni
        </span>
      </div>
    </div>
  );
}
