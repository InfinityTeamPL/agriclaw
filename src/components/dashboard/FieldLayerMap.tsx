'use client';

// Mapa pola z prawdziwą heatmapą Sentinel-2 jako PNG overlay.
// Switcher warstw: NDVI / NDRE / NDWI / SAVI / True color.
// Każda warstwa to kolorowy PNG wygenerowany przez CDSE Process API
// z gradientem kolorów adekwatnym do indeksu.

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, Layers, Sprout, Leaf, Droplets, MountainSnow, Camera, Satellite } from 'lucide-react';
import { hybridStyle } from '@/lib/map-style';
import { cn } from '@/lib/utils';

type LayerType = 'ndvi' | 'ndre' | 'ndwi' | 'savi' | 'truecolor' | 'planet';

interface LayerResponse {
  type: LayerType;
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  dataUrl: string;
  observedAt: string;
}

interface Props {
  fieldId: string;
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  className?: string;
}

const LAYERS: Array<{
  id: LayerType;
  label: string;
  icon: typeof Sprout;
  color: string;
  hint: string;
}> = [
  { id: 'ndvi', label: 'NDVI', icon: Sprout, color: 'text-emerald-700', hint: 'Zdrowie roślin' },
  { id: 'ndre', label: 'NDRE', icon: Leaf, color: 'text-amber-700', hint: 'Azot' },
  { id: 'ndwi', label: 'NDWI', icon: Droplets, color: 'text-sky-700', hint: 'Woda' },
  { id: 'savi', label: 'SAVI', icon: MountainSnow, color: 'text-stone-700', hint: 'Biomasa+gleba' },
  { id: 'truecolor', label: 'Sentinel', icon: Camera, color: 'text-violet-700', hint: 'RGB Sentinel-2 10m (świeże)' },
  { id: 'planet', label: 'Planet 3m', icon: Satellite, color: 'text-indigo-700', hint: 'PSScene 3m rozdzielczość, dzienne pokrycie' },
];

const LEGENDS: Record<LayerType, Array<{ color: string; label: string }>> = {
  ndvi: [
    { color: '#7f1d1d', label: '< 0.1 — goła ziemia' },
    { color: '#dc2626', label: '0.1-0.25 — stres' },
    { color: '#f97316', label: '0.25-0.4 — słabe' },
    { color: '#facc15', label: '0.4-0.55 — średnie' },
    { color: '#84cc16', label: '0.55-0.7 — dobre' },
    { color: '#14532d', label: '> 0.7 — bujne' },
  ],
  ndre: [
    { color: '#dc2626', label: '< 0.15 — silny niedobór N' },
    { color: '#f97316', label: '0.15-0.25 — niedobór N' },
    { color: '#facc15', label: '0.25-0.35 — graniczny' },
    { color: '#84cc16', label: '0.35-0.45 — optimum' },
    { color: '#14532d', label: '> 0.45 — nadmiar N' },
  ],
  ndwi: [
    { color: '#dc2626', label: '< 0 — stres wodny' },
    { color: '#facc15', label: '0-0.15 — umiarkowany' },
    { color: '#38bdf8', label: '0.15-0.35 — dobry' },
    { color: '#1e40af', label: '> 0.35 — bardzo dobry' },
  ],
  savi: [
    { color: '#dc2626', label: '< 0.1 — goła gleba' },
    { color: '#f97316', label: '0.1-0.3 — słabe wschody' },
    { color: '#facc15', label: '0.3-0.5 — średnie' },
    { color: '#84cc16', label: '0.5-0.7 — dobre' },
    { color: '#14532d', label: '> 0.7 — bujne' },
  ],
  truecolor: [
    { color: '#8b7355', label: 'Brąz — gleba' },
    { color: '#4a7c2c', label: 'Zielony — roślinność' },
    { color: '#1e40af', label: 'Niebieski — woda' },
  ],
  planet: [
    { color: '#4a7c2c', label: 'Zieleń — roślinność' },
    { color: '#8b7355', label: 'Brąz — gleba' },
    { color: '#1e40af', label: 'Niebieski — woda' },
  ],
};

export function FieldLayerMap({ fieldId, polygon, centroid, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('ndvi');
  const [layerData, setLayerData] = useState<Record<LayerType, LayerResponse | null>>({
    ndvi: null, ndre: null, ndwi: null, savi: null, truecolor: null, planet: null,
  });
  const [layerLoading, setLayerLoading] = useState<LayerType | null>(null);
  const [layerError, setLayerError] = useState<string | null>(null);

  // Mount map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: hybridStyle,
      center: [centroid.lon, centroid.lat],
      zoom: 16,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // Polygon outline (zawsze widoczny niezależnie od warstwy)
      map.addSource('field-boundary', {
        type: 'geojson',
        data: { type: 'Feature', geometry: polygon, properties: {} },
      });
      map.addLayer({
        id: 'field-boundary-outline-white',
        type: 'line',
        source: 'field-boundary',
        paint: { 'line-color': '#ffffff', 'line-width': 4 },
      });
      map.addLayer({
        id: 'field-boundary-outline',
        type: 'line',
        source: 'field-boundary',
        paint: { 'line-color': '#065f46', 'line-width': 2 },
      });

      // Fit bounds
      const coords = polygon.coordinates[0] ?? [];
      if (coords.length >= 3) {
        const bounds = new maplibregl.LngLatBounds(
          coords[0] as [number, number],
          coords[0] as [number, number],
        );
        for (const c of coords) bounds.extend(c as [number, number]);
        map.fitBounds(bounds, { padding: 40, duration: 0, maxZoom: 18 });
      }

      setMapReady(true);
    });

    mapRef.current = map;

    // Pobierz scouting pinezki + dodaj jako markers
    fetch(`/api/scouting?fieldId=${fieldId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((items: Array<{
        id: string; lat: number; lon: number; tag: string; severity: string;
        note: string | null; photoUrl: string | null; createdAt: string;
      }>) => {
        const tagColors: Record<string, string> = {
          disease: '#f59e0b',
          pest: '#dc2626',
          frost: '#0ea5e9',
          mechanical: '#78716c',
          weed: '#16a34a',
          other: '#6b7280',
        };
        const tagLabels: Record<string, string> = {
          disease: 'Choroba',
          pest: 'Szkodnik',
          frost: 'Przymrozek',
          mechanical: 'Mechaniczne',
          weed: 'Chwasty',
          other: 'Inne',
        };
        for (const s of items) {
          const el = document.createElement('div');
          el.className = 'scouting-pin';
          el.style.cssText = `
            width: 22px; height: 22px; border-radius: 50%;
            background: ${tagColors[s.tag] ?? '#6b7280'};
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
          `;
          const date = new Date(s.createdAt).toLocaleDateString('pl-PL');
          const notePart = s.note ? `<div style="margin-top:4px;color:#555">${s.note.slice(0, 100)}</div>` : '';
          const photoPart = s.photoUrl
            ? `<img src="${s.photoUrl}" style="margin-top:6px;max-width:200px;max-height:120px;border-radius:6px" />`
            : '';
          const popup = new maplibregl.Popup({ offset: 14, maxWidth: '260px' }).setHTML(
            `<div style="font-family:system-ui;font-size:12px;line-height:1.4">
              <div style="font-weight:600;color:${tagColors[s.tag] ?? '#6b7280'}">${tagLabels[s.tag] ?? s.tag} · ${s.severity}</div>
              <div style="color:#888;font-size:10px">${date}</div>
              ${notePart}
              ${photoPart}
            </div>`,
          );
          new maplibregl.Marker({ element: el })
            .setLngLat([s.lon, s.lat])
            .setPopup(popup)
            .addTo(map);
        }
      })
      .catch(() => {});

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data dla aktywnej warstwy
  useEffect(() => {
    if (layerData[activeLayer] !== null) return; // już mamy
    let alive = true;
    setLayerLoading(activeLayer);
    setLayerError(null);
    // Planet używa osobnego endpointu (quick-search PSScene),
    // pozostałe warstwy idą przez /layer?type=... (Sentinel-2 CDSE Process API)
    const url =
      activeLayer === 'planet'
        ? `/api/analysis/${fieldId}/planet`
        : `/api/analysis/${fieldId}/layer?type=${activeLayer}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${r.status}`);
        }
        const raw = await r.json();
        // Normalizacja: Planet zwraca {dataUrl, bbox, observedAt} — dopasuj do LayerResponse
        if (activeLayer === 'planet') {
          return {
            type: 'planet' as LayerType,
            bbox: raw.bbox,
            dataUrl: raw.dataUrl,
            observedAt: raw.observedAt,
          } satisfies LayerResponse;
        }
        return raw as LayerResponse;
      })
      .then((data) => {
        if (!alive) return;
        setLayerData((prev) => ({ ...prev, [activeLayer]: data }));
      })
      .catch((err) => {
        if (!alive) return;
        setLayerError(String(err.message ?? err));
      })
      .finally(() => {
        if (alive) setLayerLoading(null);
      });
    return () => {
      alive = false;
    };
  }, [activeLayer, fieldId, layerData]);

  // Update overlay w mapie kiedy aktywna warstwa lub dane się zmieniły
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Zdejmij poprzednie overlaye
    for (const l of LAYERS) {
      const srcId = `layer-${l.id}`;
      const layerId = `layer-${l.id}-raster`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(srcId)) map.removeSource(srcId);
    }

    const current = layerData[activeLayer];
    if (!current) return;

    const srcId = `layer-${activeLayer}`;
    const layerId = `layer-${activeLayer}-raster`;

    // MapLibre image source: 4 rogi bounding boxa [top-left, top-right, bottom-right, bottom-left]
    const { minLon, minLat, maxLon, maxLat } = current.bbox;
    map.addSource(srcId, {
      type: 'image',
      url: current.dataUrl,
      coordinates: [
        [minLon, maxLat], // top-left
        [maxLon, maxLat], // top-right
        [maxLon, minLat], // bottom-right
        [minLon, minLat], // bottom-left
      ],
    });
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: srcId,
        paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 300 },
      },
      // Wstaw przed outline żeby outline był na wierzchu
      'field-boundary-outline-white',
    );
  }, [activeLayer, layerData, mapReady]);

  const current = layerData[activeLayer];
  const activeLabel = LAYERS.find((l) => l.id === activeLayer)!;

  return (
    <div className={className ?? 'relative w-full h-[480px]'}>
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100 rounded-3xl">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Layer switcher — lewy górny */}
      <div className="absolute top-3 left-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg ring-1 ring-black/5 p-1.5 flex gap-1 flex-wrap max-w-[calc(100%-24px)]">
        {LAYERS.map((l) => {
          const Icon = l.icon;
          const isActive = activeLayer === l.id;
          const isLoading = layerLoading === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setActiveLayer(l.id)}
              title={l.hint}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition',
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100',
              )}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-emerald-300' : l.color)} />
              )}
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Stan ładowania / błąd */}
      {layerLoading && (
        <div className="absolute top-16 left-3 rounded-xl bg-white/95 backdrop-blur-md shadow-md ring-1 ring-black/5 px-3 py-2 text-xs flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
          Pobieram warstwę {LAYERS.find((l) => l.id === layerLoading)?.label} z Sentinel-2…
        </div>
      )}

      {layerError && !layerLoading && (
        <div className="absolute top-16 left-3 rounded-xl bg-red-50 text-red-800 shadow-md ring-1 ring-red-200 px-3 py-2 text-xs max-w-sm">
          Błąd: {layerError.slice(0, 120)}
        </div>
      )}

      {/* Legenda — lewy dolny */}
      {current && (
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="rounded-2xl bg-white/95 backdrop-blur-md shadow-lg ring-1 ring-black/5 p-3 text-xs space-y-2 max-w-[200px]">
            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
              <Layers className="w-3.5 h-3.5" />
              Legenda · {activeLabel.label}
            </div>
            <div className="space-y-1">
              {LEGENDS[activeLayer].map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[10px] text-gray-600 leading-tight">{entry.label}</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-gray-400 pt-1 border-t border-gray-100">
              Sentinel-2 · 10 m/piksel · {new Date(current.observedAt).toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
