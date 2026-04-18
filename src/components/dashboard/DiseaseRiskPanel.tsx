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
  Sparkles,
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

const riskMeta: Record<Risk, { bg: string; label: string; ring: string; text: string }> = {
  high: { bg: 'bg-red-600', label: 'Wysokie', ring: 'ring-red-200', text: 'text-red-700' },
  medium: { bg: 'bg-amber-500', label: 'Średnie', ring: 'ring-amber-200', text: 'text-amber-700' },
  low: { bg: 'bg-emerald-500', label: 'Niskie', ring: 'ring-emerald-200', text: 'text-emerald-700' },
};

// Przyporządkuj ikonę po nazwie choroby
function iconFor(disease: string) {
  if (/fusarium|fuzarioz|phytophthora|zaraza/i.test(disease)) return AlertOctagon;
  if (/septoria|septorioz|phoma/i.test(disease)) return ShieldAlert;
  if (/rdza|mączniak|alternaria/i.test(disease)) return Bug;
  return Sparkles;
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
      <div className="rounded-3xl bg-white border border-gray-200 p-5 flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        Liczę ryzyko chorób (7 modeli grzybowych × BBCH)…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-purple-50 border border-purple-200 p-4 text-sm text-purple-900">
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
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-emerald-900 text-sm">
            Brak zagrożeń grzybowych
          </div>
          <div className="text-xs text-emerald-700 mt-0.5">
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
        'rounded-xl border p-5 space-y-3',
        hasHigh ? 'bg-white border-red-200' : 'bg-white border-amber-200',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
            hasHigh
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-amber-50 text-amber-700 border-amber-200',
          )}
        >
          <Bug className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {hasHigh
              ? `Wysokie ryzyko chorób (${highRisk.length})`
              : `Podwyższone ryzyko chorób (${realRisks.length})`}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Na podstawie pogody 72h + BBCH{' '}
            {data.bbch !== null ? `(${data.bbch} · ${data.bbchLabel})` : ''}
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
                'rounded-2xl border bg-white ring-1 transition',
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
                    'w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0',
                    meta.bg,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {r.disease}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-semibold text-white',
                        meta.bg,
                      )}
                    >
                      {meta.label} · score {r.score}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {r.reason}
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {expanded && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold">Dlaczego: </span>
                    {r.reason}
                  </div>
                  <div
                    className={cn(
                      'rounded-xl border p-3 text-sm leading-relaxed flex gap-2',
                      r.risk === 'high'
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900',
                    )}
                  >
                    <Droplets className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
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

      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
        <span>Open-Meteo 72h hourly + 7-dniowa prognoza dzienna</span>
        <span>7 modeli: Septoria / Fusarium / Rdza / Mączniak / Phytophthora / Alternaria / Phoma</span>
      </div>
    </div>
  );
}
