'use client';

// Widget radarowy (Sentinel-1 SAR) — sprawdza VV/VH/RVI na żądanie.
// Kluczowe w pochmurne dni (PL ma 60-70% chmur w sezonie wegetacyjnym).
// Wykrywa wyleganie (spadek VH o >3 dB) i zalania (wzrost VH + niski VV).

import { useState } from 'react';
import { Waves, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RadarResponse {
  fieldId: string;
  observedAt: string;
  radar: {
    vv: { mean: number; min: number; max: number };
    vh: { mean: number; min: number; max: number };
    rvi: { mean: number; min: number; max: number };
  };
  interpretation: {
    diagnosis: string;
    severity: 'none' | 'low' | 'medium' | 'high';
    details: string;
  };
  note: string;
}

const severityClass: Record<RadarResponse['interpretation']['severity'], string> = {
  none: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  low: 'bg-sky-50 border-sky-200 text-sky-900',
  medium: 'bg-amber-50 border-amber-200 text-amber-900',
  high: 'bg-red-50 border-red-200 text-red-900',
};

const severityIconColor: Record<RadarResponse['interpretation']['severity'], string> = {
  none: 'text-emerald-600',
  low: 'text-sky-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
};

export function RadarBadge({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analysis/${fieldId}/radar`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? 'Sentinel-1 radar niedostępny');
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
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 transition"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Waves className="w-4 h-4" />}
        {loading
          ? 'Sentinel-1 radar pobiera ostatnie przejście...'
          : 'Sprawdź pole radarem (widzi przez chmury)'}
      </button>
    );
  }

  const { radar, interpretation } = data;
  const sev = interpretation.severity;
  const IconSev = sev === 'none' ? CheckCircle2 : AlertTriangle;
  const iconColor = severityIconColor[sev];

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${severityClass[sev]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconSev className={`w-5 h-5 ${iconColor}`} />
          <div>
            <div className="text-xs uppercase tracking-wider opacity-70 font-semibold">
              Sentinel-1 SAR · radar
            </div>
            <div className="text-lg font-semibold">
              {interpretation.diagnosis}
            </div>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono opacity-70 shrink-0">
          VV {radar.vv.mean.toFixed(1)} dB<br />
          VH {radar.vh.mean.toFixed(1)} dB<br />
          RVI {radar.rvi.mean.toFixed(2)}
        </div>
      </div>
      <p className="text-sm opacity-90 leading-relaxed">{interpretation.details}</p>
      <div className="rounded-xl bg-white/60 backdrop-blur-sm p-2.5 text-[11px] leading-relaxed">
        <b>Jak czytać:</b> VV (vertical-vertical) odbiciem od powierzchni gleby/łanu; VH (vertical-horizontal) od struktur pionowych jak źdźbła/liście. Spadek VH = rośliny położone. RVI 0..1 — wyższy = więcej biomasy.
      </div>
      <button
        onClick={() => {
          setData(null);
          check();
        }}
        className="text-[10px] underline opacity-60 hover:opacity-100"
      >
        Sprawdź ponownie
      </button>
    </div>
  );
}
