'use client';

// Frost Alert — prognoza przymrozków na najbliższe 10 nocy.
// Progi szyte per uprawa + BBCH. W kwitnieniu rzepaku -4°C = dramat.
// Komponent jest świadomy progów — kolor nocy zależy od fazy wegetacji.

import { useEffect, useState } from 'react';
import { Snowflake, AlertTriangle, Thermometer, ShieldCheck, Loader2, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

type FrostLevel = 'safe' | 'watch' | 'warning' | 'critical';

interface FrostNight {
  date: string;
  tMin: number;
  level: FrostLevel;
  headline: string;
}

interface FrostResponse {
  fieldId: string;
  crop: string;
  bbch: number;
  bbchLabel: string;
  sensitivityPhase: string;
  damageThreshold: number;
  lethalThreshold: number;
  worstLevel: FrostLevel;
  minTempC: number;
  firstDangerDate: string | null;
  nights: FrostNight[];
  recommendation: string;
}

interface Props {
  fieldId: string;
}

const levelBg: Record<FrostLevel, string> = {
  safe: 'bg-emerald-500',
  watch: 'bg-sky-400',
  warning: 'bg-amber-500',
  critical: 'bg-red-600',
};

const levelBgSoft: Record<FrostLevel, string> = {
  safe: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  watch: 'bg-sky-50 text-sky-900 border-sky-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  critical: 'bg-red-50 text-red-900 border-red-200',
};

const levelIcon: Record<FrostLevel, typeof Snowflake> = {
  safe: ShieldCheck,
  watch: Thermometer,
  warning: AlertTriangle,
  critical: Snowflake,
};

const levelLabel: Record<FrostLevel, string> = {
  safe: 'Bezpiecznie',
  watch: 'Chłodna noc',
  warning: 'Ostrzeżenie',
  critical: 'Krytycznie',
};

function dayLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  if (iso === today) return 'Dziś';
  if (iso === tomorrow) return 'Jutro';
  return new Date(iso).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' });
}

export function FrostAlert({ fieldId }: Props) {
  const [data, setData] = useState<FrostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/fields/${fieldId}/frost`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<FrostResponse>;
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
        Sprawdzam prognozę przymrozków na 10 nocy…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
        Prognoza przymrozków niedostępna: {error}
      </div>
    );
  }

  if (!data) return null;

  // Nie pokazuj widgetu jeśli nic ciekawego się nie dzieje — redukuje szum UI.
  // ALE: pokaż zawsze gdy jest warning/critical (nawet za 10 dni).
  const hasInteresting =
    data.worstLevel === 'warning' || data.worstLevel === 'critical' || data.minTempC <= 5;
  if (!hasInteresting) {
    return null;
  }

  const Icon = levelIcon[data.worstLevel];

  return (
    <div
      className={cn(
        'rounded-3xl border p-5 space-y-4 transition',
        data.worstLevel === 'critical'
          ? 'bg-gradient-to-br from-red-50 to-white border-red-200 ring-1 ring-red-100'
          : data.worstLevel === 'warning'
            ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200 ring-1 ring-amber-100'
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
                  ? 'bg-amber-500 text-white'
                  : data.worstLevel === 'watch'
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-emerald-100 text-emerald-700',
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {data.worstLevel === 'critical'
                ? 'Krytyczne ryzyko przymrozków'
                : data.worstLevel === 'warning'
                  ? 'Ostrzeżenie przed przymrozkami'
                  : data.worstLevel === 'watch'
                    ? 'Chłodne noce — obserwuj'
                    : 'Prognoza: bezpiecznie'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Faza: {data.sensitivityPhase} · próg −{Math.abs(data.damageThreshold)}°C
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Minimum
          </div>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums',
              data.minTempC <= data.damageThreshold
                ? 'text-red-700'
                : data.minTempC <= 2
                  ? 'text-amber-700'
                  : 'text-sky-700',
            )}
          >
            {data.minTempC.toFixed(1)}°C
          </div>
        </div>
      </div>

      {/* 10-nocna prognoza — pasek kolorowy */}
      <div>
        <div className="flex items-center gap-1">
          {data.nights.map((n) => (
            <div
              key={n.date}
              title={`${dayLabel(n.date)} · ${n.headline}`}
              className={cn(
                'flex-1 h-9 rounded-md relative group cursor-pointer transition hover:scale-y-110',
                levelBg[n.level],
              )}
              style={{ opacity: 0.85 }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[9px] font-semibold leading-tight">
                <div>{new Date(n.date).getDate()}</div>
                <div className="font-mono tabular-nums">{n.tMin.toFixed(0)}°</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5 font-mono">
          <span>{dayLabel(data.nights[0]?.date ?? '')}</span>
          <span>{dayLabel(data.nights[data.nights.length - 1]?.date ?? '')}</span>
        </div>
      </div>

      {/* Rekomendacja — tylko gdy jest zagrożenie */}
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

      {/* Legenda mini */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap pt-1 border-t border-gray-100">
        {(['critical', 'warning', 'watch', 'safe'] as const).map((l) => (
          <div key={l} className="inline-flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-sm', levelBg[l])} />
            <span>{levelLabel[l]}</span>
          </div>
        ))}
        <span className="inline-flex items-center gap-1 text-gray-400 ml-auto">
          <Wind className="w-3 h-3" />
          Open-Meteo · 10 nocy
        </span>
      </div>
    </div>
  );
}
