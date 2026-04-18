// Shared MapLibre style configs dla AgriClaw.
// - satelliteStyle: Sentinel-2 Cloudless (EOX WMTS) + ESRI fallback na high-zoom
// - hybridStyle: Sentinel-2 + etykiety OSM na wierzchu (tak jak Copernicus Browser)
// - basicStyle: fallback road map (OpenFreeMap Liberty)
//
// S2 Cloudless jest bezchmurnym mozaikiem Sentinel-2 aktualizowanym co sezon.
// Tego samego używa Copernicus Browser i SentinelHub EO Browser.
// Zoom 0-14 → S2, zoom 14-19 → ESRI (S2 Cloudless ma max_zoom=14).

import type { StyleSpecification } from 'maplibre-gl';

const ATTRIBUTION_ESRI =
  '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';
const ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ATTRIBUTION_S2 =
  '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by <a href="https://eox.at/">EOX IT Services GmbH</a>';

// Sentinel-2 Cloudless WMTS (EOX)
// `tiles.maps.eox.at` to publiczny endpoint, layer `s2cloudless_3857` bierze najnowszy rok.
// Format REST: /wmts/1.0.0/{layer}/default/g/{z}/{y}/{x}.jpg (WMTS TileRow/TileCol order)
const S2_CLOUDLESS_TILES = [
  'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg',
];

const ESRI_IMAGERY_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

/**
 * Czysty widok satelitarny — Sentinel-2 Cloudless do zoom 14, ESRI wyżej.
 * Zoom 14 = ~1 km widoczne, potem ESRI daje pojedyncze pole.
 */
export const satelliteStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    s2: {
      type: 'raster',
      tiles: S2_CLOUDLESS_TILES,
      tileSize: 256,
      maxzoom: 14,
      attribution: ATTRIBUTION_S2,
    },
    esri: {
      type: 'raster',
      tiles: ESRI_IMAGERY_TILES,
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
    {
      id: 's2-cloudless',
      type: 'raster',
      source: 's2',
      minzoom: 0,
      maxzoom: 14,
      paint: {
        'raster-fade-duration': 200,
      },
    },
  ],
};

/**
 * Hybrid: Sentinel-2 + ESRI dla wysokich zoomów + etykiety OSM.
 * Używamy tego wszędzie w aplikacji (onboarding, pola, analiza).
 */
export const hybridStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    s2: {
      type: 'raster',
      tiles: S2_CLOUDLESS_TILES,
      tileSize: 256,
      maxzoom: 14,
      attribution: ATTRIBUTION_S2,
    },
    esri: {
      type: 'raster',
      tiles: ESRI_IMAGERY_TILES,
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
      maxzoom: 19,
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
      id: 's2-cloudless',
      type: 'raster',
      source: 's2',
      minzoom: 0,
      maxzoom: 14,
      paint: {
        'raster-fade-duration': 200,
      },
    },
    {
      id: 'osm-labels',
      type: 'raster',
      source: 'labels',
      minzoom: 6,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.75,
      },
    },
  ],
};

/**
 * Fallback road map (jeśli satelita nie ładuje się np. przez proxy).
 */
export const basicStyle = 'https://tiles.openfreemap.org/styles/liberty';
