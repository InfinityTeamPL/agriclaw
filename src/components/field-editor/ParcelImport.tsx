'use client';

// Import działki z ARiMR (przez GUGiK ULDK) po numerze TERYT.
// Rolnik ma swoje numery w wniosku JPO, wkleja → my mamy polygon 1:1 z systemem płatności.

import { useId, useState } from 'react';
import { MapPin, Loader2, Check, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatHa, formatNumberPL } from '@/lib/ui/format';
import { fetchJson } from '@/lib/ui/api-error';

export interface ParcelResult {
  teryt: string;
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaHectares: number;
  centroid: { lat: number; lon: number };
  /** Liczba osobnych części działki (np. rozdzielonej drogą). */
  parts?: number;
}

interface Props {
  /** Wywoływane z działką po „Użyj tej działki” oraz z null, gdy rolnik zaczyna szukać innej. */
  onImported: (parcel: ParcelResult | null) => void;
}

export function ParcelImport({ onImported }: Props) {
  const inputId = useId();
  const [teryt, setTeryt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParcelResult | null>(null);

  const fetchParcel = async () => {
    const trimmed = teryt.trim();
    if (!trimmed) {
      toast.error('Podaj numer działki (TERYT).');
      return;
    }
    setLoading(true);
    setResult(null);
    // Nowe wyszukiwanie unieważnia poprzednio zaakceptowaną działkę — inaczej formularz
    // zapisu pod spodem mógłby zapisać STARĄ działkę pod nowym wynikiem.
    onImported(null);
    const res = await fetchJson<ParcelResult>(
      `/api/import/parcel?teryt=${encodeURIComponent(trimmed)}`,
      undefined,
      'Nie znaleźliśmy takiej działki. Sprawdź numer albo narysuj granicę ręcznie.',
    );
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setResult(res.data);
    toast.success(`Pobrano działkę ${trimmed} (${formatHa(res.data.areaHectares)} ha)`);
  };

  const accept = () => {
    if (result) onImported(result);
  };

  const parts = result?.parts ?? 1;

  return (
    <div className="rounded-lg bg-card border border-border shadow-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold tracking-tight text-foreground">Import z ARiMR</h3>
          <p className="text-xs text-muted-foreground">
            Masz numer działki z wniosku JPO? Wklej — pobierzemy granicę 1:1 z ewidencji.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor={inputId} className="block text-xs font-semibold text-foreground mb-1">
          Numer TERYT działki
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            value={teryt}
            onChange={(e) => setTeryt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchParcel()}
            placeholder="np. 141201_2.0001.123/4"
            className="flex-1 min-h-11 px-3 py-2 border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={fetchParcel}
            disabled={loading || !teryt.trim()}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow-card hover:brightness-110 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Pobieram" /> : 'Pobierz'}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <span>
            Format: SSXXXX_Y.ZZZZ.NNNNN/NN. Znajdziesz w eWniosek ARiMR (kolumna &bdquo;Identyfikator działki&rdquo;)
            lub na mapie geoportal.gov.pl (kliknij działkę → pokaż atrybuty).
          </span>
        </p>
      </div>

      {result && (
        <div className="rounded-md bg-signal-healthy/5 border border-signal-healthy/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-signal-healthy" />
              <span className="font-semibold text-foreground text-sm">Działka znaleziona</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{result.teryt}</span>
          </div>
          <div className="text-xs text-foreground">
            Powierzchnia: <b>{formatNumberPL(result.areaHectares, 3)} ha</b>
            <br />
            Środek: {formatNumberPL(result.centroid.lat, 5)}, {formatNumberPL(result.centroid.lon, 5)}
          </div>
          {parts > 1 && (
            <p className="flex items-start gap-1.5 rounded-md bg-signal-heat/10 border border-signal-heat/30 px-2.5 py-2 text-xs text-foreground">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-signal-heat" />
              <span>
                Ta działka ma {parts} oddzielne części (np. rozdzielone drogą). Pole obejmuje jedną część,
                największą. Pozostałe dodaj jako osobne pola.
              </span>
            </p>
          )}
          <button
            onClick={accept}
            className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow-card hover:brightness-110 transition"
          >
            <Check className="w-4 h-4" />
            Użyj tej działki
          </button>
        </div>
      )}
    </div>
  );
}
