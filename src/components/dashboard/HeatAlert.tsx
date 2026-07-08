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
  safe: 'bg-signal-healthy',
  watch: 'bg-signal-heat/50',
  warning: 'bg-signal-heat',
  critical: 'bg-destructive',
};

const levelBgSoft: Record<HeatLevel, string> = {
  safe: 'bg-signal-healthy/10 text-signal-healthy border-signal-healthy/30',
  watch: 'bg-signal-heat/10 text-signal-heat border-signal-heat/30',
  warning: 'bg-signal-heat/10 text-signal-heat border-signal-heat/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
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
  return new Date(iso).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'short', day: 'numeric' });
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
        'rounded-lg border bg-card shadow-card p-5 space-y-4',
        data.worstLevel === 'critical'
          ? 'border-destructive/30'
          : data.worstLevel === 'warning'
            ? 'border-signal-heat/30'
            : 'border-border',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center shrink-0 border',
              data.worstLevel === 'critical'
                ? 'bg-destructive/10 text-destructive border-destructive/30'
                : data.worstLevel === 'warning'
                  ? 'bg-signal-heat/10 text-signal-heat border-signal-heat/30'
                  : 'bg-signal-heat/10 text-signal-heat border-signal-heat/30',
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {data.worstLevel === 'critical'
                ? 'Krytyczny stres cieplny'
                : data.worstLevel === 'warning'
                  ? 'Stres cieplny'
                  : 'Upalne dni — obserwuj'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Faza: {data.sensitivityPhase} · próg {data.stressThreshold}°C
              {data.consecutiveStressDays >= 2 && ` · ${data.consecutiveStressDays} dni pod rząd`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="hud-label">
            Maksimum
          </div>
          <div
            className={cn(
              'text-2xl font-bold font-mono tabular',
              data.maxTempC >= data.criticalThreshold
                ? 'text-destructive'
                : data.maxTempC >= data.stressThreshold
                  ? 'text-signal-heat'
                  : 'text-signal-heat',
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
                <div className="font-mono tabular">{d.tMax.toFixed(0)}°</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
          <span>{dayLabel(data.days[0]?.date ?? '')}</span>
          <span>{dayLabel(data.days[data.days.length - 1]?.date ?? '')}</span>
        </div>
      </div>

      {/* Rekomendacja */}
      {(data.worstLevel === 'warning' || data.worstLevel === 'critical') && (
        <div
          className={cn(
            'rounded-lg border p-3 text-sm leading-relaxed',
            levelBgSoft[data.worstLevel],
          )}
        >
          {data.recommendation}
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap pt-1 border-t border-border">
        {(['critical', 'warning', 'watch', 'safe'] as const).map((l) => (
          <div key={l} className="inline-flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-sm', levelBg[l])} />
            <span>{levelLabel[l]}</span>
          </div>
        ))}
        <span className="inline-flex items-center gap-1 text-muted-foreground ml-auto">
          <Thermometer className="w-3 h-3" />
          Open-Meteo · 10 dni
        </span>
      </div>
    </div>
  );
}
