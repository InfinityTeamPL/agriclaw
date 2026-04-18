'use client';

// Import działki z ARiMR (przez GUGiK ULDK) po numerze TERYT.
// Rolnik ma swoje numery w wniosku JPO, wkleja → my mamy polygon 1:1 z systemem płatności.

import { useState } from 'react';
import { MapPin, Loader2, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ParcelResult {
  teryt: string;
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaHectares: number;
  centroid: { lat: number; lon: number };
}

interface Props {
  onImported: (parcel: ParcelResult) => void;
}

export function ParcelImport({ onImported }: Props) {
  const [teryt, setTeryt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParcelResult | null>(null);

  const fetchParcel = async () => {
    const trimmed = teryt.trim();
    if (!trimmed) {
      toast.error('Podaj numer działki (TERYT)');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/import/parcel?teryt=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Działka nie znaleziona');
        return;
      }
      setResult(data as ParcelResult);
      toast.success(`Pobrano działkę ${trimmed} (${data.areaHectares.toFixed(2)} ha)`);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (result) onImported(result);
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Import z ARiMR</h3>
          <p className="text-xs text-gray-500">
            Masz numer działki z wniosku JPO? Wklej — pobierzemy granicę 1:1 z ewidencji.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Numer TERYT działki
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={teryt}
            onChange={(e) => setTeryt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchParcel()}
            placeholder="np. 141201_2.0001.123/4"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={fetchParcel}
            disabled={loading || !teryt.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pobierz'}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <span>
            Format: SSXXXX_Y.ZZZZ.NNNNN/NN. Znajdziesz w eWniosek ARiMR (kolumna "Identyfikator działki")
            lub na mapie geoportal.gov.pl (kliknij działkę → pokaż atrybuty).
          </span>
        </p>
      </div>

      {result && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-emerald-900 text-sm">
                Działka znaleziona
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-800">{result.teryt}</span>
          </div>
          <div className="text-xs text-emerald-900">
            Powierzchnia: <b>{result.areaHectares.toFixed(3)} ha</b>
            <br />
            Centroid: {result.centroid.lat.toFixed(5)}, {result.centroid.lon.toFixed(5)}
          </div>
          <button
            onClick={accept}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition"
          >
            <Check className="w-4 h-4" />
            Użyj tej działki
          </button>
        </div>
      )}
    </div>
  );
}
