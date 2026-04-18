'use client';

// Widget termalny — sprawdza temperaturę powierzchni liścia z Landsat 8/9.
// Użytkownik klika "Sprawdź temperaturę" → fetch endpoint → wyświetl status.

import { useState } from 'react';
import { Thermometer, Loader2, AlertTriangle, Snowflake, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface ThermalResponse {
  thermal: { meanC: number; minC: number; maxC: number; spread: number; validCount: number };
  interpretation: { status: string; diagnosis: string; action: string };
  observedAt: string;
  source: string;
}

export function ThermalBadge({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<ThermalResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analysis/${fieldId}/thermal`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? 'Landsat niedostępny');
        return;
      }
      setData(d);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <button
        onClick={check}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-900 transition"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Thermometer className="w-4 h-4" />}
        {loading ? 'Landsat sprawdza temperaturę...' : 'Sprawdź temperaturę powierzchni (Landsat)'}
      </button>
    );
  }

  const { thermal, interpretation } = data;
  const Icon = interpretation.status === 'high' ? Flame : interpretation.status === 'cold' ? Snowflake : interpretation.status === 'elevated' ? AlertTriangle : Thermometer;
  const colorClass = interpretation.status === 'high' ? 'text-red-700 bg-red-50 border-red-200' : interpretation.status === 'cold' ? 'text-sky-700 bg-sky-50 border-sky-200' : interpretation.status === 'elevated' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <div>
            <div className="text-xs uppercase tracking-wider opacity-70 font-semibold">
              Temperatura pola (Landsat 8/9)
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {thermal.meanC.toFixed(1)}°C
            </div>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono opacity-70">
          min {thermal.minC.toFixed(1)}°<br />
          max {thermal.maxC.toFixed(1)}°<br />
          Δ {thermal.spread.toFixed(1)}°
        </div>
      </div>
      <p className="text-sm">{interpretation.diagnosis}</p>
      <div className="rounded-xl bg-white/60 backdrop-blur-sm p-2.5 text-xs">
        <b>Działanie:</b> {interpretation.action}
      </div>
      <button
        onClick={() => { setData(null); check(); }}
        className="text-[10px] underline opacity-60 hover:opacity-100"
      >
        Sprawdź ponownie
      </button>
    </div>
  );
}
