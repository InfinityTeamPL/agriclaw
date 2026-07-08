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
      <div className="rounded-lg bg-card border border-border shadow-card p-5 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-signal-heat" />
        Liczę dawkę azotu na podstawie NDRE i fazy…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-signal-heat/10 border border-signal-heat/30 p-4 text-sm text-signal-heat">
        Kalkulator N niedostępny: {error}
      </div>
    );
  }

  if (!data) return null;

  const rec = data.recommendation;

  // Jeśli out-of-window — pokaż mini info card, nie główny panel
  if (rec.window === 'out-of-window') {
    return (
      <div className="rounded-lg bg-secondary border border-border p-4 flex items-start gap-3 text-sm">
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Beaker className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">Kalkulator azotu</div>
          <div className="text-xs text-muted-foreground mt-0.5">
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
    <div className="rounded-lg bg-card border border-signal-heat/30 shadow-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-signal-heat/10 text-signal-heat border border-signal-heat/30 flex items-center justify-center shrink-0">
            <Beaker className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Kalkulator azotu</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {rec.windowLabel}
            </div>
          </div>
        </div>
        {rec.ndreUsed !== null && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-signal-heat/30 text-xs">
            <Leaf className="w-3 h-3 text-signal-healthy" />
            NDRE <span className="font-bold font-mono tabular">{rec.ndreUsed.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Big dawka */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-signal-heat font-semibold">
            Rekomendowana dawka
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-5xl font-bold text-foreground font-mono tabular">
              {rec.doseKgNPerHa}
            </div>
            <div className="text-muted-foreground text-lg">kg N/ha</div>
            {isReduction && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-signal-healthy/10 text-signal-healthy border border-signal-healthy/30 text-xs font-semibold">
                <TrendingDown className="w-3 h-3" />
                {rec.adjustmentPct}%
              </span>
            )}
            {isIncrease && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/30 text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                +{rec.adjustmentPct}%
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Dawka książkowa {rec.baselineKgNPerHa} kg N/ha · skorygowana NDRE
          </div>
        </div>
        {rec.savingVsBaseline && rec.savingVsBaseline.kgN > 0 && (
          <div className="rounded-lg bg-signal-healthy/10 border border-signal-healthy/30 p-3 text-right">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-signal-healthy">
              Oszczędność na polu
            </div>
            <div className="text-2xl font-semibold font-mono tabular text-signal-healthy">{rec.savingVsBaseline.pln} zł</div>
            <div className="text-[10px] text-signal-healthy">
              {rec.savingVsBaseline.kgN} kg N × {data.areaHectares.toFixed(1)} ha
            </div>
          </div>
        )}
      </div>

      {/* 3 karty: nawóz i koszt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <InfoCard
          icon={<PackageCheck className="w-4 h-4 text-signal-heat" />}
          label="Saletra 34%"
          value={`${rec.saletra34Kg} kg/ha`}
          sub={`${Math.round(rec.saletra34Kg * data.areaHectares)} kg na polu`}
        />
        <InfoCard
          icon={<PackageCheck className="w-4 h-4 text-signal-heat" />}
          label="Mocznik 46%"
          value={`${rec.mocznik46Kg} kg/ha`}
          sub={`${Math.round(rec.mocznik46Kg * data.areaHectares)} kg na polu`}
        />
        <InfoCard
          icon={<Wallet className="w-4 h-4 text-signal-heat" />}
          label="Koszt"
          value={`${rec.costPlnPerHa} zł/ha`}
          sub={`${rec.totalCostPln} zł za całe pole`}
        />
      </div>

      {/* Uzasadnienie */}
      <div className="rounded-lg bg-card border border-signal-heat/30 p-3 text-sm text-foreground leading-relaxed flex gap-2">
        <Info className="w-4 h-4 text-signal-heat shrink-0 mt-0.5" />
        <div>{rec.reasoning}</div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
        <span>
          BBCH {data.bbch} · {data.bbchLabel}
        </span>
        <span>
          {data.lastNdreObservedAt
            ? `NDRE z ${new Date(data.lastNdreObservedAt).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' })}`
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
    <div className="rounded-lg bg-card border border-signal-heat/30 p-3">
      <div className="hud-label flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground font-mono tabular">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
