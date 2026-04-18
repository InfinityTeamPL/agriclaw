'use client';

// Statyczna mapa całego gospodarstwa — wszystkie pola jako poligony.
// Non-interactive (disable panning/zoom) — dekoracyjna miniatura w dashboardzie.

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ndviColorHex } from '@/lib/satellite/ndvi';
import { Loader2 } from 'lucide-react';

interface FieldPoly {
  id: string;
  name: string;
  polygon: GeoJSON.Polygon;
  ndviMean: number | null;
}

interface Props {
  fields: FieldPoly[];
  center: { lat: number; lon: number };
  className?: string;
}

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function FarmMiniMap({ fields, center, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [center.lon, center.lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });

    map.on('load', () => {
      const features: GeoJSON.Feature[] = fields.map((f) => ({
        type: 'Feature',
        geometry: f.polygon,
        properties: {
          id: f.id,
          name: f.name,
          color: f.ndviMean !== null ? ndviColorHex(f.ndviMean) : '#64748b',
        },
      }));

      map.addSource('farm-fields', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.addLayer({
        id: 'farm-fields-fill',
        type: 'fill',
        source: 'farm-fields',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.55,
        },
      });

      map.addLayer({
        id: 'farm-fields-outline',
        type: 'line',
        source: 'farm-fields',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
        },
      });

      // Fit to all fields
      if (features.length > 0) {
        const allCoords: [number, number][] = [];
        for (const feat of features) {
          const geom = feat.geometry as GeoJSON.Polygon;
          for (const c of geom.coordinates[0] as [number, number][]) {
            allCoords.push(c);
          }
        }
        if (allCoords.length >= 2) {
          const bounds = new maplibregl.LngLatBounds(allCoords[0], allCoords[0]);
          for (const c of allCoords) bounds.extend(c);
          map.fitBounds(bounds, { padding: 30, duration: 0, maxZoom: 15 });
        }
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

  return (
    <div className={className ?? 'relative w-full h-[280px]'}>
      <div className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100">
        <div ref={containerRef} className="absolute inset-0" />
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-emerald-700 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ładuję mapę...
          </div>
        </div>
      )}
      {/* Gradient overlay for readability */}
      <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-3xl bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none" />
    </div>
  );
}
