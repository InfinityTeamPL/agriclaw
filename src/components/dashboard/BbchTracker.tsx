'use client';

import { useEffect, useState } from 'react';
import { Wheat, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

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
      <div className="rounded-3xl bg-white border border-gray-200 p-5 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
        <div className="h-8 bg-gray-100 rounded mb-2" />
        <div className="h-2 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl bg-white border border-gray-200 p-5 text-sm text-gray-500">
        {error ?? 'Brak danych BBCH'}
      </div>
    );
  }

  const { status } = data;

  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
            <Wheat className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Faza rozwoju</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
              BBCH model · GDD
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-700 tabular-nums leading-none">
            BBCH {status.currentBbch}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{status.currentLabel}</div>
        </div>
      </div>

      {status.currentDescription && (
        <p className="text-xs text-gray-600">{status.currentDescription}</p>
      )}

      {/* Progress bar sezonowy */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
          <span>Postęp sezonu</span>
          <span>{status.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Siew {new Date(data.sowingDate).toLocaleDateString('pl-PL')}</span>
          <span className="font-mono">{status.accumulated} GDD</span>
        </div>
      </div>

      {/* Następny milestone */}
      {status.nextMilestone && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50/50 border border-sky-100 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
              <Clock className="w-3.5 h-3.5" />
              Następna faza
            </div>
            {status.daysToNext !== null && (
              <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-semibold">
                za ~{status.daysToNext} dni
              </span>
            )}
          </div>
          <div>
            <span className="font-semibold text-gray-900">BBCH {status.nextMilestone.bbch}</span>
            <span className="text-gray-600"> — {status.nextMilestone.label}</span>
          </div>
          <div className="text-[10px] font-mono text-gray-500">
            <TrendingUp className="inline w-3 h-3 mr-1" />
            potrzeba jeszcze {Math.round(status.gddToNext)} GDD (T_base {status.tBase}°C)
          </div>
        </div>
      )}

      {/* Alerty agronomiczne */}
      {status.alerts.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
            Co zrobić
          </div>
          {status.alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-700" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {data.sowingDateIsEstimate && (
        <div className="text-[10px] text-gray-400 italic border-t border-gray-100 pt-2">
          Data siewu oszacowana z typu uprawy. W ustawieniach pola podaj faktyczną żeby
          uzyskać większą dokładność.
        </div>
      )}
    </div>
  );
}
