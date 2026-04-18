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

// GUGiK Ortofotomapa — oficjalne polskie zdjęcia lotnicze 25 cm (lokalnie 10 cm).
// Darmowe, bez API key, pokrycie 100% Polski, aktualizacja co 2-3 lata.
// WMS endpoint z geoportal.gov.pl, wygodniej przez WMS-to-XYZ proxy stylu.
const GUGIK_ORTHO_WMS =
  'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=Raster&STYLES=default&FORMAT=image/jpeg&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

const ATTRIBUTION_GUGIK =
  '&copy; <a href="http://www.gugik.gov.pl/">GUGiK</a> Geoportal.gov.pl';

// World_Imagery ma max native zoom 19 (30 cm dla większości PL) — pozwalamy aż tam.
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
 * GUGiK ortofotomapa — najdokładniejsza warstwa dla Polski (25 cm / 10 cm).
 * Świeższa od ESRI w wielu regionach (aktualizacja co 2-3 lata).
 */
export const gugikOrthoStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    gugik: {
      type: 'raster',
      tiles: [GUGIK_ORTHO_WMS],
      tileSize: 256,
      maxzoom: 19,
      attribution: ATTRIBUTION_GUGIK,
    },
    // Fallback na ESRI poza PL (użytkownicy z gospodarstwami blisko granicy)
    esri: {
      type: 'raster',
      tiles: ESRI_IMAGERY_TILES,
      tileSize: 256,
      maxzoom: 19,
      attribution: ATTRIBUTION_ESRI,
    },
  },
  layers: [
    { id: 'esri-base', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 22 },
    { id: 'gugik-ortho', type: 'raster', source: 'gugik', minzoom: 8, maxzoom: 22 },
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
