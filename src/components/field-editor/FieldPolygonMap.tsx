'use client';

// Read-only MapLibre pokazujący poligon pola z fit bounds.

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2 } from 'lucide-react';
import { hybridStyle } from '@/lib/map-style';

interface Props {
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  ndviMean?: number | null;
  className?: string;
}

function ndviToColor(ndvi: number): string {
  if (ndvi < 0.2) return '#78350f';
  if (ndvi < 0.35) return '#dc2626';
  if (ndvi < 0.5) return '#f97316';
  if (ndvi < 0.6) return '#facc15';
  if (ndvi < 0.7) return '#84cc16';
  if (ndvi < 0.8) return '#16a34a';
  return '#14532d';
}

export function FieldPolygonMap({ polygon, centroid, ndviMean, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: hybridStyle,
      center: [centroid.lon, centroid.lat],
      zoom: 16,
      interactive: true,
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
      map.addSource('field-polygon', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: polygon,
          properties: {},
        },
      });
      const fillColor = typeof ndviMean === 'number' ? ndviToColor(ndviMean) : '#10b981';
      map.addLayer({
        id: 'field-polygon-fill',
        type: 'fill',
        source: 'field-polygon',
        paint: {
          'fill-color': fillColor,
          'fill-opacity': 0.45,
        },
      });
      map.addLayer({
        id: 'field-polygon-outline',
        type: 'line',
        source: 'field-polygon',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
        },
      });
      map.addLayer({
        id: 'field-polygon-outline-inner',
        type: 'line',
        source: 'field-polygon',
        paint: {
          'line-color': '#065f46',
          'line-width': 1.5,
        },
      });

      const coords = polygon.coordinates[0] ?? [];
      if (coords.length >= 3) {
        const bounds = new maplibregl.LngLatBounds(
          coords[0] as [number, number],
          coords[0] as [number, number],
        );
        for (const c of coords) bounds.extend(c as [number, number]);
        map.fitBounds(bounds, { padding: 30, duration: 0, maxZoom: 18 });
      }

      setReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [polygon, centroid.lat, centroid.lon, ndviMean]);

  return (
    <div className={className ?? 'relative w-full h-[400px]'}>
      <div className="absolute inset-0 bg-gray-100">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <div className="flex items-center gap-2 text-emerald-700 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ładuję mapę...
          </div>
        </div>
      )}
    </div>
  );
}
