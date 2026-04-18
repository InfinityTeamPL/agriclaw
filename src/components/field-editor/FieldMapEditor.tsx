'use client';

// Interaktywny edytor pola na mapie MapLibre.
// - Rolnik klika kolejne wierzchołki poligonu
// - Auto-zamknięcie pierścienia przy zapisie (pierwszy punkt = ostatni)
// - Min 3 wierzchołki
// - Po zapisie wysyła POST /api/fields i redirect na szczegóły pola

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';
import { Loader2, Trash2, Undo2, Save, MapIcon } from 'lucide-react';
import { CROPS } from '@/lib/ui/format';

interface Props {
  farmId: string;
  center: { lat: number; lon: number };
}

type Lnglat = [number, number]; // [lon, lat]

const SATELLITE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function FieldMapEditor({ farmId, center }: Props) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [name, setName] = useState('');
  const [crop, setCrop] = useState<(typeof CROPS)[number]['value']>('wheat');
  const [points, setPoints] = useState<Lnglat[]>([]);
  const [saving, setSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // State ref dla callbacków wewnątrz map handlers
  const pointsRef = useRef<Lnglat[]>([]);
  useEffect(() => {
    pointsRef.current = points;
    updateMapSources(mapRef.current, points);
  }, [points]);

  // Mount map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: SATELLITE_STYLE,
      center: [center.lon, center.lat],
      zoom: 15,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.on('load', () => {
      // Poligon fill
      map.addSource('field-polygon', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      });
      map.addLayer({
        id: 'field-polygon-fill',
        type: 'fill',
        source: 'field-polygon',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.35,
        },
      });
      map.addLayer({
        id: 'field-polygon-outline',
        type: 'line',
        source: 'field-polygon',
        paint: {
          'line-color': '#065f46',
          'line-width': 2,
        },
      });

      // Linia dla polylinii zanim zamkniemy pierścień
      map.addSource('field-line', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      });
      map.addLayer({
        id: 'field-line',
        type: 'line',
        source: 'field-line',
        paint: {
          'line-color': '#065f46',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });

      // Wierzchołki jako kropki
      map.addSource('field-points', {
        type: 'geojson',
        data: emptyFeatureCollection(),
      });
      map.addLayer({
        id: 'field-points',
        type: 'circle',
        source: 'field-points',
        paint: {
          'circle-color': '#059669',
          'circle-radius': 5,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        },
      });

      setMapReady(true);
      updateMapSources(map, pointsRef.current);
    });

    map.on('click', (e) => {
      const next: Lnglat = [e.lngLat.lng, e.lngLat.lat];
      setPoints((prev) => [...prev, next]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lon]);

  const polygonReady = points.length >= 3;

  const areaHa = useMemo(() => {
    if (!polygonReady) return 0;
    return estimatePolygonAreaHa(points);
  }, [polygonReady, points]);

  const undo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setPoints([]);
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Podaj nazwę pola.');
      return;
    }
    if (!polygonReady) {
      toast.error('Zaznacz min. 3 wierzchołki granicy pola.');
      return;
    }

    const ring = closeRing(points);
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [ring],
    };

    setSaving(true);
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          name: trimmed,
          polygon,
          crop,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Nie udało się zapisać pola. Spróbuj ponownie.',
        );
        setSaving(false);
        return;
      }
      const created = (await res.json()) as { id: string };
      toast.success('Pole zapisane.');
      router.push(`/dashboard/fields/${created.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Nieoczekiwany błąd. Spróbuj ponownie.');
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      {/* Lewa kolumna — formularz */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 h-fit">
        <div>
          <label htmlFor="field-name" className="block text-sm font-medium mb-1 text-gray-800">
            Nazwa pola
          </label>
          <input
            id="field-name"
            type="text"
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Pole za stodołą"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="field-crop" className="block text-sm font-medium mb-1 text-gray-800">
            Uprawa
          </label>
          <select
            id="field-crop"
            value={crop}
            onChange={(e) => setCrop(e.target.value as (typeof CROPS)[number]['value'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {CROPS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900 leading-relaxed">
          <div className="font-medium mb-1 flex items-center gap-1.5">
            <MapIcon className="w-3.5 h-3.5" />
            Jak rysować
          </div>
          Klikaj na mapie, aby dodać kolejne wierzchołki. Minimum 3 punkty. Pierścień
          zostanie zamknięty automatycznie przy zapisie.
        </div>

        <div className="text-sm text-gray-700 space-y-1">
          <div>
            Wierzchołków: <span className="font-medium">{points.length}</span>
          </div>
          {polygonReady && (
            <div>
              Szacowana powierzchnia:{' '}
              <span className="font-medium">
                {areaHa.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} ha
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={points.length === 0 || saving}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <Undo2 className="w-4 h-4" />
            Cofnij
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={points.length === 0 || saving}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Wyczyść
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!polygonReady || !name.trim() || saving}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Zapisuję...' : 'Zapisz pole'}
        </button>
      </div>

      {/* Prawa kolumna — mapa */}
      <div className="relative w-full h-[420px] sm:h-[560px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
        <div ref={mapContainerRef} className="absolute inset-0" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-50/80 to-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-700 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ładuję mapę...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- helpers ----------

function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

function updateMapSources(map: maplibregl.Map | null, points: Lnglat[]) {
  if (!map || !map.isStyleLoaded()) return;
  const polygonSrc = map.getSource('field-polygon') as
    | maplibregl.GeoJSONSource
    | undefined;
  const lineSrc = map.getSource('field-line') as
    | maplibregl.GeoJSONSource
    | undefined;
  const pointsSrc = map.getSource('field-points') as
    | maplibregl.GeoJSONSource
    | undefined;
  if (!polygonSrc || !lineSrc || !pointsSrc) return;

  if (points.length >= 3) {
    polygonSrc.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [closeRing(points)] },
          properties: {},
        },
      ],
    });
    lineSrc.setData(emptyFeatureCollection());
  } else {
    polygonSrc.setData(emptyFeatureCollection());
    if (points.length >= 2) {
      lineSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: points },
            properties: {},
          },
        ],
      });
    } else {
      lineSrc.setData(emptyFeatureCollection());
    }
  }

  pointsSrc.setData({
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: p },
      properties: {},
    })),
  });
}

function closeRing(points: Lnglat[]): Lnglat[] {
  if (points.length === 0) return [];
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return points;
  return [...points, first];
}

// Geodetyczna estymacja powierzchni poligonu w hektarach (formula spherical excess).
// Używamy przybliżenia dla małych pól — wystarczy do wyświetlenia.
function estimatePolygonAreaHa(points: Lnglat[]): number {
  const ring = closeRing(points);
  if (ring.length < 4) return 0;
  const R = 6_378_137; // promień Ziemi w metrach
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    total +=
      ((lon2 - lon1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  const areaSqM = Math.abs((total * R * R) / 2);
  return areaSqM / 10_000;
}
