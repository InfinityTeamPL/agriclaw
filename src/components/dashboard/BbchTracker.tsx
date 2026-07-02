'use client';

import { useEffect, useState } from 'react';
import { Wheat, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface BbchStatus {
  crop: string;
  currentBbch: number;
  currentLabel: string;
  currentDescription: string;
  nextMilestone: {
    bbch: number;
    gddFromSowing: number;
    label: string;
    description: string;
    alerts?: string[];
  } | null;
  gddToNext: number;
  daysToNext: number | null;
  progress: number;
  alerts: string[];
  accumulated: number;
  tBase: number;
}

interface Response {
  fieldId: string;
  crop: string;
  sowingDate: string;
  sowingDateIsEstimate: boolean;
  daysSinceSowing: number;
  status: BbchStatus;
}

export function BbchTracker({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/fields/${fieldId}/bbch`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? 'Błąd');
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
      <div className="rounded-lg bg-card border border-border shadow-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="h-8 bg-muted rounded mb-2" />
        <div className="h-2 bg-muted rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-card border border-border shadow-card p-5 text-sm text-muted-foreground">
        {error ?? 'Brak danych BBCH'}
      </div>
    );
  }

  const { status } = data;

  return (
    <div className="rounded-lg bg-card border border-border shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center">
            <Wheat className="w-4 h-4 text-signal-healthy" />
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight text-foreground">
              Faza rozwoju
            </div>
            <div className="hud-label">BBCH model · GDD</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono tabular text-3xl font-semibold text-foreground leading-none">
            BBCH {status.currentBbch}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{status.currentLabel}</div>
        </div>
      </div>

      {status.currentDescription && (
        <p className="text-xs text-muted-foreground">{status.currentDescription}</p>
      )}

      {/* Progress bar sezonowy */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="hud-label">Postęp sezonu</span>
          <span className="font-mono tabular text-[10px] text-muted-foreground">
            {status.progress}%
          </span>
        </div>
        {/* Wypełnienie = sygnał zdrowia rośliny (dane) */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-signal-healthy transition-all"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>
            Siew{' '}
            <span className="font-mono tabular">
              {new Date(data.sowingDate).toLocaleDateString('pl-PL')}
            </span>
          </span>
          <span className="font-mono tabular">{status.accumulated} GDD</span>
        </div>
      </div>

      {/* Następny milestone */}
      {status.nextMilestone && (
        <div className="rounded-md bg-secondary border border-border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Następna faza
            </div>
            {status.daysToNext !== null && (
              <span className="font-mono tabular text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-semibold">
                za ~{status.daysToNext} dni
              </span>
            )}
          </div>
          <div>
            <span className="font-mono tabular font-semibold text-foreground">
              BBCH {status.nextMilestone.bbch}
            </span>
            <span className="text-muted-foreground"> — {status.nextMilestone.label}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            <TrendingUp className="inline w-3 h-3 mr-1" />
            potrzeba jeszcze{' '}
            <span className="font-mono tabular">{Math.round(status.gddToNext)} GDD</span> (T_base{' '}
            <span className="font-mono tabular">{status.tBase}°C</span>)
          </div>
        </div>
      )}

      {/* Alerty agronomiczne — amber = sygnał ostrzegawczy (dane) */}
      {status.alerts.length > 0 && (
        <div className="space-y-2">
          <div className="hud-label text-signal-heat">Co zrobić</div>
          {status.alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md bg-signal-heat/10 border border-signal-heat/30 p-3 text-xs text-foreground"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-signal-heat" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {data.sowingDateIsEstimate && (
        <div className="text-[10px] text-muted-foreground italic border-t border-border pt-2">
          Data siewu oszacowana z typu uprawy. W ustawieniach pola podaj faktyczną żeby
          uzyskać większą dokładność.
        </div>
      )}
    </div>
  );
}
