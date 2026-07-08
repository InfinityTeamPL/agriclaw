'use client';

// Statyczna mapa całego gospodarstwa — wszystkie pola jako poligony.
// Non-interactive (disable panning/zoom) — dekoracyjna miniatura w dashboardzie.
//
// Kadr: pola gospodarstwa potrafią leżeć w oddalonych okolicach (np. działka
// z importu ULDK 300 km dalej). Dopasowanie do WSZYSTKICH pól dawało wtedy
// widok całej Polski, na którym hektarowe poligony są mniejsze niż piksel.
// Dlatego: klastrujemy pola po odległości i kadrujemy największe skupisko;
// pola poza kadrem sygnalizuje plakietka. Przy średnim oddaleniu widoczność
// zapewniają kropki centroidów (znikają przy zbliżeniu, gdy widać poligony).

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ndviColorHex } from '@/lib/design/ndvi-scale';
import { hybridStyle } from '@/lib/map-style';
import { pluralPL } from '@/lib/ui/format';
import { centroidOf, clusterByDistance, pickMainCluster, type LngLat } from '@/lib/geo/cluster';
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

export function FarmMiniMap({ fields, center, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: hybridStyle,
      center: [center.lon, center.lat],
      zoom: 14,
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

      // Kropki centroidów — pola widoczne też przy oddaleniu, gdy poligony
      // są sub-pikselowe; znikają płynnie przy zbliżeniu (widać już poligony).
      const centroids = fields.map((f) => centroidOf(f.polygon));
      const centroidFeatures: GeoJSON.Feature[] = fields.flatMap((f, i) => {
        const c = centroids[i];
        if (!c) return [];
        return [
          {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: c },
            properties: {
              color: f.ndviMean !== null ? ndviColorHex(f.ndviMean) : '#64748b',
            },
          },
        ];
      });
      map.addSource('field-centroids', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: centroidFeatures },
      });
      map.addLayer({
        id: 'field-centroid-dots',
        type: 'circle',
        source: 'field-centroids',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 11, 5, 13, 0],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 1, 13, 0],
          'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 12, 1, 13, 0],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      });

      // Kadr: największe skupisko pól (nie wszystkie — patrz komentarz u góry).
      const validIdx = centroids.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
      if (validIdx.length > 0) {
        const clusters = clusterByDistance(
          validIdx.map((i) => centroids[i]!),
          25,
        ).map((g) => g.map((k) => validIdx[k]));
        // Największe skupisko; przy remisie — bliższe adresowi gospodarstwa.
        const farmCenter: LngLat = [center.lon, center.lat];
        const main = pickMainCluster(clusters, centroids, farmCenter);
        setHiddenCount(fields.length - main.length);

        const coords: LngLat[] = [];
        for (const i of main) {
          const ring = (fields[i].polygon?.coordinates?.[0] ?? []) as LngLat[];
          coords.push(...ring);
        }
        if (coords.length >= 2) {
          const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
          for (const c of coords) bounds.extend(c);
          map.fitBounds(bounds, { padding: 40, duration: 0, maxZoom: 15.5 });
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
      <div className="absolute inset-0 rounded-lg overflow-hidden bg-secondary">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-signal-healthy text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ładuję mapę…
          </div>
        </div>
      )}
      {hiddenCount > 0 && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-card/95 border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-heat" />
          <span className="hud-label">
            +{hiddenCount} {pluralPL(hiddenCount, 'pole', 'pola', 'pól')} w innej okolicy
          </span>
        </div>
      )}
      {/* Gradient overlay for readability */}
      <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-lg bg-gradient-to-t from-foreground/30 to-transparent pointer-events-none" />
    </div>
  );
}
