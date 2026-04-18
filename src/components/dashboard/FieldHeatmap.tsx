'use client';

// MapLibre z poligonem pola pokolorowanym wg NDVI (data-driven styling).
// Jeśli NDVI brak — neutralny zielony fill. Interaktywne pan/zoom.

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2 } from 'lucide-react';
import { ndviColorHex } from '@/lib/satellite/ndvi';

interface Props {
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  ndviMean: number | null;
  className?: string;
}

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function FieldHeatmap({ polygon, centroid, ndviMean, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [centroid.lon, centroid.lat],
      zoom: 15,
      interactive: true,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      const color = ndviMean !== null ? ndviColorHex(ndviMean) : '#10b981';

      // Build "heat cells" by splitting the polygon using a grid of sample points
      // (simple visual heatmap gradient — data-driven on a per-segment basis).
      // Here we use 3 stacked copies of the polygon with offset opacity to simulate heatmap depth.
      map.addSource('field-poly', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: polygon,
          properties: { ndvi: ndviMean ?? 0.5 },
        },
      });

      // Outer glow
      map.addLayer({
        id: 'field-poly-glow',
        type: 'fill',
        source: 'field-poly',
        paint: {
          'fill-color': color,
          'fill-opacity': 0.18,
        },
      });
      // Main heat fill with data-driven color (interpolated)
      map.addLayer({
        id: 'field-poly-fill',
        type: 'fill',
        source: 'field-poly',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'ndvi'],
            0,
            '#7f1d1d',
            0.15,
            '#dc2626',
            0.3,
            '#f97316',
            0.45,
            '#facc15',
            0.55,
            '#84cc16',
            0.65,
            '#22c55e',
            0.75,
            '#14532d',
          ],
          'fill-opacity': 0.6,
        },
      });
      // Crisp outline
      map.addLayer({
        id: 'field-poly-outline',
        type: 'line',
        source: 'field-poly',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'field-poly-outline-dark',
        type: 'line',
        source: 'field-poly',
        paint: {
          'line-color': '#064e3b',
          'line-width': 1,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1.5],
        },
      });

      const coords = polygon.coordinates[0] ?? [];
      if (coords.length >= 3) {
        const bounds = new maplibregl.LngLatBounds(
          coords[0] as [number, number],
          coords[0] as [number, number],
        );
        for (const c of coords) bounds.extend(c as [number, number]);
        map.fitBounds(bounds, { padding: 60, duration: 0 });
      }

      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the fill when ndviMean changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource('field-poly') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: polygon,
        properties: { ndvi: ndviMean ?? 0.5 },
      });
    }
  }, [ndviMean, polygon, ready]);

  return (
    <div className={className ?? 'relative w-full h-[480px]'}>
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100">
        <div ref={containerRef} className="absolute inset-0" />
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-700 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ładuję mapę...
          </div>
        </div>
      )}
      {/* NDVI legend */}
      {ready && ndviMean !== null && (
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="rounded-xl bg-white/90 backdrop-blur border border-white shadow-lg px-3 py-2 text-[11px] space-y-1.5">
            <div className="font-semibold text-gray-700">Skala NDVI</div>
            <div className="flex items-center gap-1 w-40">
              <div
                className="h-2 flex-1 rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, #7f1d1d, #dc2626, #f97316, #facc15, #84cc16, #22c55e, #14532d)',
                }}
              />
            </div>
            <div className="flex justify-between text-gray-500">
              <span>0.0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
