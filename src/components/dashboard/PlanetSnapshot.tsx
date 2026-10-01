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
  /** Granice pola — zaznaczamy je na podglądzie całej sceny. */
  fieldBbox?: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  previewMetersPerPixel?: number;
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
        Podgląd dzisiejszej sceny Planet (czy nad polem były chmury)
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
  // Pole na podglądzie całej sceny (min. 8 px, żeby było widać kilkuhektarowe pole).
  const fieldMarker = (() => {
    const s = data!.bbox;
    const f = data!.fieldBbox;
    if (!f || s.maxLon <= s.minLon || s.maxLat <= s.minLat) return null;
    const left = ((f.minLon - s.minLon) / (s.maxLon - s.minLon)) * 100;
    const top = ((s.maxLat - f.maxLat) / (s.maxLat - s.minLat)) * 100;
    const w = ((f.maxLon - f.minLon) / (s.maxLon - s.minLon)) * 100;
    const h = ((f.maxLat - f.minLat) / (s.maxLat - s.minLat)) * 100;
    if (left < 0 || top < 0 || left > 100 || top > 100) return null;
    return { left: `${left}%`, top: `${top}%`, width: `max(8px, ${w}%)`, height: `max(8px, ${h}%)` };
  })();
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
                Podgląd całej sceny · {data!.resolution}
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
            alt="Planet PSScene — podgląd całej sceny"
            className="w-full h-auto group-hover:opacity-95 transition"
          />
          {fieldMarker && (
            <span
              aria-label="Położenie pola (przybliżone)"
              className="absolute rounded-sm ring-2 ring-signal-heat ring-offset-1 ring-offset-transparent"
              style={fieldMarker}
            />
          )}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-foreground/70 text-background text-[10px] font-mono">
            Kliknij, żeby powiększyć
          </div>
        </button>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Planet fotografuje Polskę codziennie — podgląd pokazuje, czy dziś nad polem
          {fieldMarker ? ' (pomarańczowa ramka)' : ''} były chmury. Analiza kondycji pola
          korzysta z Sentinel-2 (10 m). Pełne 3 m z Planet wymaga planu płatnego.
        </p>

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
