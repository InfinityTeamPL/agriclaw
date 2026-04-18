// Shared MapLibre style configs dla AgriClaw.
// - satelliteStyle: ESRI World Imagery (darmowe, bez klucza, globalne pokrycie)
// - hybridStyle: ESRI satelita + etykiety OSM na wierzchu
// - basicStyle: fallback road map (OpenFreeMap Liberty)

import type { StyleSpecification } from 'maplibre-gl';

const ATTRIBUTION_ESRI =
  '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';
const ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Czysty widok z góry (satelita) — tym domyślnie pokazujemy pola.
 */
export const satelliteStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: ATTRIBUTION_ESRI,
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/**
 * Satelita + etykiety (miejscowości, drogi) — do onboardingu / nawigacji.
 * CartoDB Positron labels only (transparent background).
 */
export const hybridStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: ATTRIBUTION_ESRI,
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://cartodb-basemaps-a.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
        'https://cartodb-basemaps-b.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
        'https://cartodb-basemaps-c.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: ATTRIBUTION_OSM,
    },
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'osm-labels',
      type: 'raster',
      source: 'labels',
      minzoom: 4,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.85,
      },
    },
  ],
};

/**
 * Fallback road map (jeśli satelita nie ładuje się np. przez proxy).
 */
export const basicStyle = 'https://tiles.openfreemap.org/styles/liberty';
