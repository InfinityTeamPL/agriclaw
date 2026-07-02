'use client';

// Widget radarowy (Sentinel-1 SAR) — sprawdza VV/VH/RVI na żądanie.
// Kluczowe w pochmurne dni (PL ma 60-70% chmur w sezonie wegetacyjnym).
// Wykrywa wyleganie (spadek VH o >3 dB) i zalania (wzrost VH + niski VV).

import { useState } from 'react';
import { Waves, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScanLine } from '@/components/brand/ScanLine';

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

// Kolory statusu = sygnały agronomiczne (dane): zdrowie=zieleń, info=frost/niebieski,
// ostrzeżenie=heat/amber, alarm=drought/oxide. Progi/logika bez zmian.
const severityClass: Record<RadarResponse['interpretation']['severity'], string> = {
  none: 'border-signal-healthy/30 bg-signal-healthy/5 text-foreground',
  low: 'border-signal-frost/30 bg-signal-frost/5 text-foreground',
  medium: 'border-signal-heat/30 bg-signal-heat/5 text-foreground',
  high: 'border-signal-drought/40 bg-signal-drought/5 text-foreground',
};

const severityIconColor: Record<RadarResponse['interpretation']['severity'], string> = {
  none: 'text-signal-healthy',
  low: 'text-signal-frost',
  medium: 'text-signal-heat',
  high: 'text-signal-drought',
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
        className="relative w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-border bg-card text-foreground font-medium hover:border-foreground/30 transition disabled:opacity-70"
      >
        {loading ? (
          <ScanLine className="w-4 h-4" />
        ) : (
          <Waves className="w-4 h-4 text-primary" />
        )}
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
    <div className={`rounded-lg border p-4 space-y-3 shadow-card ${severityClass[sev]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconSev className={`w-5 h-5 shrink-0 ${iconColor}`} />
          <div>
            <div className="hud-label">Sentinel-1 SAR · radar</div>
            <div className="font-display text-lg font-semibold tracking-tight">
              {interpretation.diagnosis}
            </div>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono tabular text-muted-foreground shrink-0">
          VV {radar.vv.mean.toFixed(1)} dB<br />
          VH {radar.vh.mean.toFixed(1)} dB<br />
          RVI {radar.rvi.mean.toFixed(2)}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.details}</p>
      <div className="rounded-md border border-border bg-card p-2.5 text-[11px] text-muted-foreground leading-relaxed">
        <b className="text-foreground">Jak czytać:</b> VV (vertical-vertical) odbiciem od powierzchni gleby/łanu; VH (vertical-horizontal) od struktur pionowych jak źdźbła/liście. Spadek VH = rośliny położone. RVI 0..1 — wyższy = więcej biomasy.
      </div>
      <button
        onClick={() => {
          setData(null);
          check();
        }}
        className="hud-label underline underline-offset-2 hover:text-foreground transition"
      >
        Sprawdź ponownie
      </button>
    </div>
  );
}
