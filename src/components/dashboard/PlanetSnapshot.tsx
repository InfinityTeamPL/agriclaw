'use client';

// Planet Labs snapshot — osobna karta z najnowszym zdjęciem PSScene (thumbnail 512x512).
// Pokazuje natywny rozmiar obrazu (ostre) + metadane sceny.
// Alternatywa/uzupełnienie dla warstw Sentinel-2 na mapie.
// Thumbnail pokrywa całą scenę (~24×8 km), więc Twoje pole to fragment — kontekst regionalny.

import { useState } from 'react';
import { Satellite, Calendar, CloudSun, Info } from 'lucide-react';
import { ScanLine } from '@/components/brand/ScanLine';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

interface PlanetResponse {
  type: 'planet';
  provider: string;
  resolution: string;
  itemId: string;
  observedAt: string;
  cloudCover: number;
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  dataUrl: string;
  sizeBytes: number;
  alternativesCount: number;
}

export function PlanetSnapshot({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<PlanetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlarged, setEnlarged] = useState(false);

  const fetchSnapshot = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analysis/${fieldId}/planet`);
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(d);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Stan 1: przycisk wyjściowy / ładowanie (scan-sweep zamiast spinnera)
  if (!data && !error) {
    if (loading) {
      return (
        <ScanLine
          label="Planet pobiera najnowszą scenę…"
          className="w-full h-12 border border-border"
        />
      );
    }
    return (
      <button
        onClick={fetchSnapshot}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-border bg-card hover:border-foreground/30 hover:bg-secondary text-foreground transition text-sm font-medium"
      >
        <Satellite className="w-4 h-4 text-muted-foreground" />
        Pokaż najnowszą scenę Planet (3m)
      </button>
    );
  }

  // Stan 2: błąd
  if (error) {
    return (
      <div className="rounded-md border border-border bg-secondary p-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">Planet niedostępny</div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">{error}</div>
          <button
            onClick={() => {
              setError(null);
              fetchSnapshot();
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline mt-2"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Stan 3: dane
  const cloudPct = (data!.cloudCover * 100).toFixed(0);
  const date = new Date(data!.observedAt);

  return (
    <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
      <NdviKeyline height={3} rounded={false} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
              <Satellite className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold tracking-tight text-foreground">
                Planet Labs PSScene
              </div>
              <div className="hud-label">
                {data!.provider} · {data!.resolution} rozdzielczości
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setData(null);
              fetchSnapshot();
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0"
          >
            Odśwież
          </button>
        </div>

        {/* Thumbnail w natywnej rozdzielczości */}
        <button
          type="button"
          onClick={() => setEnlarged(true)}
          className="block w-full group relative overflow-hidden rounded-md border border-border bg-secondary"
        >
          <img
            src={data!.dataUrl}
            alt="Planet PSScene thumbnail"
            className="w-full h-auto max-h-[320px] object-cover group-hover:opacity-95 transition"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-foreground/70 text-background text-[10px] font-mono">
            Kliknij, żeby powiększyć
          </div>
        </button>

        {/* Metadane */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-secondary border border-border p-2">
            <div className="flex items-center gap-1 hud-label">
              <Calendar className="w-3 h-3" />
              Data
            </div>
            <div className="mt-0.5 font-mono tabular font-semibold text-foreground">
              {date.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono tabular">
              {date.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="rounded-md bg-secondary border border-border p-2">
            <div className="flex items-center gap-1 hud-label">
              <CloudSun className="w-3 h-3" />
              Zachmurzenie
            </div>
            <div className="mt-0.5 font-mono tabular font-semibold text-foreground">{cloudPct}%</div>
            <div className="text-[10px] text-muted-foreground">
              {Number(cloudPct) < 20 ? 'bezchmurnie' : Number(cloudPct) < 50 ? 'częściowo' : 'duże'}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground flex items-start gap-1 border-t border-border pt-2">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Scena pokrywa ~24×8 km. Twoje pole to fragment obrazu. Do ostrej heatmapy pola przełącz
            warstwę mapy na Sentinel-2 (10 m/piksel, precyzyjnie wycięte do pola).
          </span>
        </div>
      </div>

      {/* Modal po kliknięciu */}
      {enlarged && (
        <div
          className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setEnlarged(false)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={data!.dataUrl}
              alt="Planet PSScene full view"
              className="max-w-full max-h-[90vh] rounded-lg shadow-pop"
            />
            <div className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-foreground/70 text-background text-xs">
              Kliknij, żeby zamknąć
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
