'use client';

// Kalkulator azotu — ile kg N/ha i ile worków mocznika/saletry w złotówkach.
// Korekta NDRE: jeśli roślina ma dużo azotu → oszczędzamy, jeśli mało → dokładamy.
// Najczęstszy WOW-moment: "dawka książkowa 70 kg, Ty dasz 45 kg, oszczędność 250 zł/ha".

import { useEffect, useState } from 'react';
import {
  Loader2,
  Beaker,
  TrendingDown,
  TrendingUp,
  Info,
  Leaf,
  PackageCheck,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NWindow = 'N1-start' | 'N2-flag-leaf' | 'N3-foliar' | 'out-of-window';

interface NRecommendation {
  crop: string;
  bbch: number;
  areaHectares: number;
  window: NWindow;
  windowLabel: string;
  doseKgNPerHa: number;
  baselineKgNPerHa: number;
  adjustmentPct: number;
  ndreUsed: number | null;
  reasoning: string;
  saletra34Kg: number;
  mocznik46Kg: number;
  costPlnPerHa: number;
  totalCostPln: number;
  totalKgN: number;
  savingVsBaseline: { kgN: number; pln: number } | null;
}

interface NResponse {
  fieldId: string;
  fieldName: string;
  crop: string;
  bbch: number;
  bbchLabel: string;
  areaHectares: number;
  lastNdreObservedAt: string | null;
  recommendation: NRecommendation;
}

interface Props {
  fieldId: string;
}

export function NitrogenCalculator({ fieldId }: Props) {
  const [data, setData] = useState<NResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/fields/${fieldId}/nitrogen`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<NResponse>;
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
        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
        Liczę dawkę azotu na podstawie NDRE i fazy…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        Kalkulator N niedostępny: {error}
      </div>
    );
  }

  if (!data) return null;

  const rec = data.recommendation;

  // Jeśli out-of-window — pokaż mini info card, nie główny panel
  if (rec.window === 'out-of-window') {
    return (
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex items-start gap-3 text-sm">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <Beaker className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-800">Kalkulator azotu</div>
          <div className="text-xs text-gray-600 mt-0.5">
            BBCH {data.bbch} ({data.bbchLabel}) — poza oknem aplikacji N dla tej uprawy.
            {rec.reasoning}
          </div>
        </div>
      </div>
    );
  }

  const isReduction = rec.adjustmentPct < 0;
  const isIncrease = rec.adjustmentPct > 0;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Kalkulator azotu</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {rec.windowLabel}
            </div>
          </div>
        </div>
        {rec.ndreUsed !== null && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-amber-200 text-xs">
            <Leaf className="w-3 h-3 text-emerald-600" />
            NDRE <span className="font-bold tabular-nums">{rec.ndreUsed.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Big dawka */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
            Rekomendowana dawka
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-5xl font-bold text-gray-900 tabular-nums">
              {rec.doseKgNPerHa}
            </div>
            <div className="text-gray-600 text-lg">kg N/ha</div>
            {isReduction && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                <TrendingDown className="w-3 h-3" />
                {rec.adjustmentPct}%
              </span>
            )}
            {isIncrease && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                +{rec.adjustmentPct}%
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Dawka książkowa {rec.baselineKgNPerHa} kg N/ha · skorygowana NDRE
          </div>
        </div>
        {rec.savingVsBaseline && rec.savingVsBaseline.kgN > 0 && (
          <div className="rounded-2xl bg-emerald-500 text-white p-3 text-right shadow-md shadow-emerald-200">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-100">
              Oszczędność na polu
            </div>
            <div className="text-2xl font-bold tabular-nums">{rec.savingVsBaseline.pln} zł</div>
            <div className="text-[10px] text-emerald-100">
              {rec.savingVsBaseline.kgN} kg N × {data.areaHectares.toFixed(1)} ha
            </div>
          </div>
        )}
      </div>

      {/* 3 karty: nawóz i koszt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <InfoCard
          icon={<PackageCheck className="w-4 h-4 text-amber-700" />}
          label="Saletra 34%"
          value={`${rec.saletra34Kg} kg/ha`}
          sub={`${Math.round(rec.saletra34Kg * data.areaHectares)} kg na polu`}
        />
        <InfoCard
          icon={<PackageCheck className="w-4 h-4 text-amber-700" />}
          label="Mocznik 46%"
          value={`${rec.mocznik46Kg} kg/ha`}
          sub={`${Math.round(rec.mocznik46Kg * data.areaHectares)} kg na polu`}
        />
        <InfoCard
          icon={<Wallet className="w-4 h-4 text-amber-700" />}
          label="Koszt"
          value={`${rec.costPlnPerHa} zł/ha`}
          sub={`${rec.totalCostPln} zł za całe pole`}
        />
      </div>

      {/* Uzasadnienie */}
      <div className="rounded-2xl bg-white border border-amber-100 p-3 text-sm text-gray-700 leading-relaxed flex gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>{rec.reasoning}</div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-amber-100">
        <span>
          BBCH {data.bbch} · {data.bbchLabel}
        </span>
        <span>
          {data.lastNdreObservedAt
            ? `NDRE z ${new Date(data.lastNdreObservedAt).toLocaleDateString('pl-PL')}`
            : 'Brak pomiaru NDRE — dawka książkowa'}
        </span>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-amber-100 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-[10px] text-gray-500">{sub}</div>
    </div>
  );
}
