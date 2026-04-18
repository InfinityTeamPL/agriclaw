'use client';

// Read-only MapLibre pokazujący poligon pola z fit bounds.

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2 } from 'lucide-react';

interface Props {
  polygon: GeoJSON.Polygon;
  centroid: { lat: number; lon: number };
  className?: string;
}

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function FieldPolygonMap({ polygon, centroid, className }: Props) {
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

      const coords = polygon.coordinates[0] ?? [];
      if (coords.length >= 3) {
        const bounds = new maplibregl.LngLatBounds(
          coords[0] as [number, number],
          coords[0] as [number, number],
        );
        for (const c of coords) bounds.extend(c as [number, number]);
        map.fitBounds(bounds, { padding: 40, duration: 0 });
      }

      setReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [polygon, centroid.lat, centroid.lon]);

  return (
    <div className={className ?? 'relative w-full h-[400px]'}>
      <div className="absolute inset-0 bg-gray-100">
        <div ref={containerRef} className="absolute inset-0" />
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
