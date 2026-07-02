'use client';

// Panel ryzyka chorób grzybowych — 7 modeli na podstawie pogody + BBCH.
// Wyświetla tylko realne ryzyka (medium/high), pomija low żeby nie szumiał UI.
// Klucz: każde ryzyko ma BBCH-aware okno fungicydu — rolnik wie KIEDY spryskać.

import { useEffect, useState } from 'react';
import {
  Loader2,
  Bug,
  ShieldAlert,
  Droplets,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Risk = 'low' | 'medium' | 'high';

interface DiseaseRisk {
  disease: string;
  risk: Risk;
  score: number;
  reason: string;
  action: string;
  crops: string[];
}

interface Response {
  fieldId: string;
  crop: string;
  bbch: number | null;
  bbchLabel: string | null;
  risks: DiseaseRisk[];
}

interface Props {
  fieldId: string;
}

// Kolory funkcjonalne (dane): mapowanie poziomu ryzyka na sygnały agronomiczne.
// high = oxide/susza (alert), medium = amber/upał, low = zieleń zdrowia.
const riskMeta: Record<
  Risk,
  { badge: string; label: string; ring: string; tint: string }
> = {
  high: {
    badge: 'bg-signal-drought',
    label: 'Wysokie',
    ring: 'ring-signal-drought/25',
    tint: 'bg-signal-drought/5 border-signal-drought/30 text-signal-drought',
  },
  medium: {
    badge: 'bg-signal-heat',
    label: 'Średnie',
    ring: 'ring-signal-heat/25',
    tint: 'bg-signal-heat/5 border-signal-heat/30 text-signal-heat',
  },
  low: {
    badge: 'bg-signal-healthy',
    label: 'Niskie',
    ring: 'ring-signal-healthy/25',
    tint: 'bg-signal-healthy/5 border-signal-healthy/30 text-signal-healthy',
  },
};

// Przyporządkuj ikonę po nazwie choroby
function iconFor(disease: string) {
  if (/fusarium|fuzarioz|phytophthora|zaraza/i.test(disease)) return AlertOctagon;
  if (/septoria|septorioz|phoma/i.test(disease)) return ShieldAlert;
  if (/rdza|mączniak|alternaria/i.test(disease)) return Bug;
  return Bug;
}

export function DiseaseRiskPanel({ fieldId }: Props) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/fields/${fieldId}/diseases`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<Response>;
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
      <div className="rounded-lg bg-card border border-border p-5 flex items-center gap-3 text-sm text-muted-foreground shadow-card">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Liczę ryzyko chorób (7 modeli grzybowych × BBCH)…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-card border border-border p-4 text-sm text-muted-foreground shadow-card">
        Ryzyko chorób niedostępne: {error}
      </div>
    );
  }

  if (!data) return null;

  // Filtruj: pokazuj tylko medium / high
  const realRisks = data.risks.filter((r) => r.risk !== 'low');

  // Jeśli nic realnego — pokaż zielony banner "brak zagrożeń"
  if (realRisks.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-border p-4 flex items-start gap-3 shadow-card">
        <div className="w-9 h-9 rounded-lg bg-signal-healthy/10 text-signal-healthy border border-signal-healthy/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-display font-semibold tracking-tight text-foreground text-sm">
            Brak zagrożeń grzybowych
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Warunki pogodowe nie sprzyjają chorobom w ciągu najbliższych 72 godzin. Monitoruj dalej — sprawdzamy co godzinę z Open-Meteo.
          </div>
        </div>
      </div>
    );
  }

  const highRisk = realRisks.filter((r) => r.risk === 'high');
  const hasHigh = highRisk.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-5 space-y-3 bg-card shadow-card',
        hasHigh ? 'border-signal-drought/40' : 'border-signal-heat/40',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
            hasHigh
              ? 'bg-signal-drought/5 text-signal-drought border-signal-drought/30'
              : 'bg-signal-heat/5 text-signal-heat border-signal-heat/30',
          )}
        >
          <Bug className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-display font-semibold tracking-tight text-foreground">
            {hasHigh
              ? `Wysokie ryzyko chorób (${highRisk.length})`
              : `Podwyższone ryzyko chorób (${realRisks.length})`}
          </div>
          <div className="hud-label mt-1">
            Na podstawie pogody 72h + BBCH{' '}
            {data.bbch !== null ? (
              <span className="tabular normal-case">
                ({data.bbch} · {data.bbchLabel})
              </span>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {realRisks.map((r, i) => {
          const meta = riskMeta[r.risk];
          const Icon = iconFor(r.disease);
          const key = `${r.disease}-${i}`;
          const expanded = expandedKey === key;
          return (
            <div
              key={key}
              className={cn(
                'rounded-md border border-border bg-card ring-1 transition',
                meta.ring,
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedKey(expanded ? null : key)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-md text-white flex items-center justify-center shrink-0',
                    meta.badge,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      {r.disease}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-semibold text-white',
                        meta.badge,
                      )}
                    >
                      {meta.label} · score <span className="tabular">{r.score}</span>
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {r.reason}
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {expanded && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">Dlaczego: </span>
                    {r.reason}
                  </div>
                  <div
                    className={cn(
                      'rounded-md border p-3 text-sm leading-relaxed flex gap-2',
                      meta.tint,
                    )}
                  >
                    <Droplets className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-foreground">
                      <span className="font-semibold">Co zrobić: </span>
                      {r.action}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between hud-label pt-2 border-t border-border">
        <span>Open-Meteo 72h hourly + 7-dniowa prognoza dzienna</span>
        <span>7 modeli: Septoria / Fusarium / Rdza / Mączniak / Phytophthora / Alternaria / Phoma</span>
      </div>
    </div>
  );
}
