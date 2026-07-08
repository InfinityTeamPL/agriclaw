'use client';

// Widget termalny — sprawdza temperaturę powierzchni liścia z Landsat 8/9.
// Graceful fallback: jeśli CDSE nie ma Landsat (LOTL2), pokazuje wyraźny komunikat
// i kieruje do alternatyw (Open-Meteo, Sentinel-2).

import { useState } from 'react';
import { Thermometer, Loader2, AlertTriangle, Snowflake, Flame, Info } from 'lucide-react';

interface ThermalResponse {
  thermal: { meanC: number; minC: number; maxC: number; spread: number; validCount: number };
  interpretation: { status: string; diagnosis: string; action: string };
  observedAt: string;
  source: string;
}

interface ErrorResponse {
  error: string;
  fallbackAvailable?: boolean;
  fallbackHint?: string;
}

export function ThermalBadge({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<ThermalResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analysis/${fieldId}/thermal`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        setError(d as ErrorResponse);
        return;
      }
      setData(d);
    } catch (err) {
      setError({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // Stan 1: przycisk wyjściowy
  if (!data && !error) {
    return (
      <button
        onClick={check}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-card hover:border-foreground/30 hover:bg-secondary text-foreground transition text-sm font-medium disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Thermometer className="w-4 h-4 text-muted-foreground" />}
        {loading ? 'Landsat sprawdza temperaturę…' : 'Sprawdź temperaturę powierzchni (Landsat)'}
      </button>
    );
  }

  // Stan 2: błąd / niedostępne
  if (error) {
    return (
      <div className="rounded-lg border border-border bg-secondary p-4 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Landsat niedostępny</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{error.error}</div>
            {error.fallbackHint && (
              <div className="text-xs text-muted-foreground mt-1">{error.fallbackHint}</div>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setError(null);
            check();
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // Stan 3: dane
  const { thermal, interpretation } = data!;
  const Icon = interpretation.status === 'high'
    ? Flame
    : interpretation.status === 'cold'
      ? Snowflake
      : interpretation.status === 'elevated'
        ? AlertTriangle
        : Thermometer;

  const colorClass =
    interpretation.status === 'high'
      ? 'text-destructive bg-destructive/10 border-destructive/30'
      : interpretation.status === 'cold'
        ? 'text-signal-frost bg-signal-frost/10 border-signal-frost/30'
        : interpretation.status === 'elevated'
          ? 'text-signal-heat bg-signal-heat/10 border-signal-heat/30'
          : 'text-signal-healthy bg-signal-healthy/10 border-signal-healthy/30';

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">
              Temperatura (Landsat 8/9)
            </div>
            <div className="text-2xl font-semibold font-mono tabular mt-0.5">
              {thermal.meanC.toFixed(1)}°C
            </div>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono tabular opacity-70 shrink-0">
          <div>min {thermal.minC.toFixed(1)}°</div>
          <div>max {thermal.maxC.toFixed(1)}°</div>
          <div>Δ {thermal.spread.toFixed(1)}°</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed">{interpretation.diagnosis}</p>
      <div className="rounded-md bg-card/70 p-2.5 text-xs leading-relaxed">
        <span className="font-semibold">Działanie: </span>
        {interpretation.action}
      </div>
      <button
        onClick={() => {
          setData(null);
          check();
        }}
        className="text-[11px] opacity-70 hover:opacity-100 underline"
      >
        Sprawdź ponownie
      </button>
    </div>
  );
}
