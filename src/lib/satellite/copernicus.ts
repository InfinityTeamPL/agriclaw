// Copernicus Data Space Ecosystem client
// - OAuth2 client_credentials do token
// - Process API → NDVI GeoTIFF dla polygonu
// - ExtractNdviValues → Float32Array do computeNdviStats
//
// Docs: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html

import { fromArrayBuffer } from 'geotiff';
import { fetchWithTimeout } from './http';

const TOKEN_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

// Per-pikselowa maska chmur z pasma Scene Classification (SCL) Sentinel-2 L2A.
// Odrzucane klasy: 3 = cień chmury, 8 = chmura (średnie prawdopodobieństwo),
// 9 = chmura (wysokie), 10 = cirrus, 11 = śnieg/lód. `dataMask` sam w sobie
// oznacza tylko brak danych/poza footprintem — NIE chmury. Bez tego chmury nad
// polem trafiają do średniej NDVI i fałszują wynik (patrz audyt 1.2).
const SCL_CLOUD_TEST = 's.SCL===3||s.SCL===8||s.SCL===9||s.SCL===10||s.SCL===11';

const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "SCL", "dataMask"],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0 || ${SCL_CLOUD_TEST}) return [NaN];
  return [(s.B08 - s.B04) / (s.B08 + s.B04)];
}`;

// Landsat 8/9 TIRS — surface temperature (LST), kelwiny → Celsjusze.
// Rewizyta 16 dni per satelita, 8 dni combined (Landsat-8 + Landsat-9).
// Rozdzielczość natywna 100m (thermal), resampled do 30m w L2.
// Użycie: wczesny stres termiczny (rośliny się przegrzewają, przed NDVI spadkiem).
const LANDSAT_THERMAL_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["ST_B10", "dataMask"],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0) return [NaN];
  // ST_B10 = Surface Temperature w Kelvinach (Scaled: 0.00341802 + offset 149.0)
  // Wynik już w Kelvinach po applyCFactor, konwertujemy na °C.
  return [s.ST_B10 - 273.15];
}`;

// Sentinel-1 SAR — przez chmury, krytyczne dla PL (200 dni/rok zachmurzenia).
// VV = Vertical-Vertical polarization, VH = Vertical-Horizontal.
// Różnica VV/VH wskazuje strukturę roślin vs ziemia.
// Backscatter w dB: -25 do 0 (niskie = gładkie jak woda, wysokie = chropowate jak pole).
const RADAR_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["VV", "VH", "dataMask"] }],
    output: { bands: 3, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0) return [NaN, NaN, NaN];
  // log10 * 10 = dB, clamped do -30..0 dla czytelności
  const vvDb = Math.max(-30, Math.min(0, 10 * Math.log(s.VV) / Math.LN10));
  const vhDb = Math.max(-30, Math.min(0, 10 * Math.log(s.VH) / Math.LN10));
  // RVI (Radar Vegetation Index) — 4*VH / (VV+VH), 0..1
  const rvi = (4 * s.VH) / (s.VV + s.VH);
  return [vvDb, vhDb, rvi];
}`;

// 4 indeksy w jednym zapytaniu — oszczędzamy CDSE quota (1 request zamiast 4).
// Band 1: NDVI — ogólne zdrowie roślin (B08, B04)
// Band 2: NDRE — niedobór azotu (B08, B05)
// Band 3: NDWI (Gao) — stres wodny w liściach (B08, B11)
// Band 4: SAVI — skorygowany o glebę (B08, B04, L=0.5)
const MULTI_INDEX_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B05", "B08", "B11", "SCL", "dataMask"],
    output: { bands: 4, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0 || ${SCL_CLOUD_TEST}) return [NaN, NaN, NaN, NaN];
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  const ndre = (s.B08 - s.B05) / (s.B08 + s.B05);
  const ndwi = (s.B08 - s.B11) / (s.B08 + s.B11);
  const L = 0.5;
  const savi = ((s.B08 - s.B04) / (s.B08 + s.B04 + L)) * (1 + L);
  return [ndvi, ndre, ndwi, savi];
}`;

const TRUE_COLOR_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02", "dataMask"],
    output: { bands: 4, sampleType: "UINT8" }
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0) return [0, 0, 0, 0];
  const gain = 2.5;
  return [
    Math.min(255, s.B04 * 255 * gain),
    Math.min(255, s.B03 * 255 * gain),
    Math.min(255, s.B02 * 255 * gain),
    255,
  ];
}`;

// Generator evalscript dla kolorowych heatmap — mapuje wartość indeksu na RGB.
function buildColorRampEvalscript(layer: 'ndvi' | 'ndre' | 'ndwi' | 'savi'): string {
  const configs = {
    ndvi: {
      bands: '["B04", "B08", "SCL", "dataMask"]',
      formula: 'const v = (s.B08 - s.B04) / (s.B08 + s.B04);',
      stops:
        '[[-0.2, [127,29,29]], [0.1, [220,38,38]], [0.25, [249,115,22]], [0.4, [250,204,21]], [0.55, [132,204,22]], [0.7, [34,197,94]], [0.85, [20,83,45]]]',
    },
    ndre: {
      bands: '["B05", "B08", "SCL", "dataMask"]',
      formula: 'const v = (s.B08 - s.B05) / (s.B08 + s.B05);',
      stops:
        '[[0, [220,38,38]], [0.15, [249,115,22]], [0.25, [250,204,21]], [0.35, [132,204,22]], [0.45, [20,83,45]]]',
    },
    ndwi: {
      bands: '["B08", "B11", "SCL", "dataMask"]',
      formula: 'const v = (s.B08 - s.B11) / (s.B08 + s.B11);',
      stops:
        '[[-0.2, [220,38,38]], [0, [250,204,21]], [0.15, [56,189,248]], [0.35, [30,64,175]]]',
    },
    savi: {
      bands: '["B04", "B08", "SCL", "dataMask"]',
      formula: 'const L = 0.5; const v = ((s.B08 - s.B04) / (s.B08 + s.B04 + L)) * (1 + L);',
      stops:
        '[[-0.2, [127,29,29]], [0.1, [220,38,38]], [0.3, [249,115,22]], [0.5, [250,204,21]], [0.7, [132,204,22]], [0.85, [20,83,45]]]',
    },
  };
  const c = configs[layer];
  return `//VERSION=3
function setup() { return { input: ${c.bands}, output: { bands: 4, sampleType: "UINT8" } }; }
function evaluatePixel(s) {
  if (s.dataMask === 0 || ${SCL_CLOUD_TEST}) return [0,0,0,0];
  ${c.formula}
  const stops = ${c.stops};
  for (let i = 0; i < stops.length - 1; i++) {
    if (v <= stops[i+1][0]) {
      const t = Math.max(0, Math.min(1, (v - stops[i][0]) / (stops[i+1][0] - stops[i][0])));
      const [r1,g1,b1] = stops[i][1];
      const [r2,g2,b2] = stops[i+1][1];
      return [r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t, 210];
    }
  }
  const [r,g,b] = stops[stops.length-1][1];
  return [r, g, b, 210];
}`;
}

export class CopernicusClient {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    if (!clientId || !clientSecret) {
      throw new Error('CopernicusClient: brak CDSE_CLIENT_ID lub CDSE_CLIENT_SECRET');
    }
  }

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    const res = await fetchWithTimeout(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      timeoutMs: 15_000,
      retries: 2,
    });
    if (!res.ok) {
      throw new Error(`CDSE auth failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.token;
  }

  async fetchNdviGeotiff(
    polygon: GeoJSON.Polygon,
    dateFrom: string,
    dateTo: string,
    opts: { width?: number; height?: number; maxCloudCoverage?: number } = {},
  ): Promise<ArrayBuffer> {
    return this.processRequest(polygon, dateFrom, dateTo, NDVI_EVALSCRIPT, opts);
  }

  /**
   * Jedno zapytanie → GeoTIFF z 4 band: NDVI, NDRE, NDWI, SAVI.
   * Używamy do pełnej analizy pola (zamiast 4 osobnych zapytań).
   */
  async fetchMultiIndexGeotiff(
    polygon: GeoJSON.Polygon,
    dateFrom: string,
    dateTo: string,
    opts: { width?: number; height?: number; maxCloudCoverage?: number } = {},
  ): Promise<ArrayBuffer> {
    return this.processRequest(polygon, dateFrom, dateTo, MULTI_INDEX_EVALSCRIPT, opts);
  }

  /**
   * Landsat 8/9 thermal — surface temperature w °C.
   * Zwraca 1-band GeoTIFF (Float32, °C, NaN dla chmur).
   * Rewizyta 8 dni (combined L8+L9).
   */
  async fetchLandsatThermalGeotiff(
    polygon: GeoJSON.Polygon,
    dateFrom: string,
    dateTo: string,
    opts: { width?: number; height?: number; maxCloudCoverage?: number } = {},
  ): Promise<ArrayBuffer> {
    const token = await this.getToken();
    const payload = {
      input: {
        bounds: {
          geometry: polygon,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [
          {
            type: 'landsat-ot-l2',
            dataFilter: {
              timeRange: { from: `${dateFrom}T00:00:00Z`, to: `${dateTo}T23:59:59Z` },
              maxCloudCoverage: opts.maxCloudCoverage ?? 30,
            },
            processing: { upsampling: 'BILINEAR' },
          },
        ],
      },
      output: {
        width: opts.width ?? 512,
        height: opts.height ?? 512,
        responses: [{ identifier: 'default', format: { type: 'image/tiff' } }],
      },
      evalscript: LANDSAT_THERMAL_EVALSCRIPT,
    };
    const res = await fetchWithTimeout(PROCESS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      timeoutMs: 30_000,
      retries: 2,
    });
    if (!res.ok) throw new Error(`CDSE Landsat thermal failed: ${res.status} ${await res.text()}`);
    return res.arrayBuffer();
  }

  /**
   * Sentinel-1 SAR — radar, widzi przez chmury.
   * Zwraca 3-band: VV (dB), VH (dB), RVI (Radar Vegetation Index).
   * Używamy gdy Sentinel-2 niedostępny (>30% chmury) albo dla wykrywania
   * szkód mechanicznych (wyleganie, zalanie, wycięcie).
   */
  async fetchRadarGeotiff(
    polygon: GeoJSON.Polygon,
    dateFrom: string,
    dateTo: string,
    opts: { width?: number; height?: number } = {},
  ): Promise<ArrayBuffer> {
    const token = await this.getToken();
    const payload = {
      input: {
        bounds: {
          geometry: polygon,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [
          {
            type: 'sentinel-1-grd',
            dataFilter: {
              timeRange: {
                from: `${dateFrom}T00:00:00Z`,
                to: `${dateTo}T23:59:59Z`,
              },
              polarization: 'DV', // dual VV+VH (standard dla rolnictwa)
              acquisitionMode: 'IW', // Interferometric Wide swath
              resolution: 'HIGH',
            },
            processing: {
              backCoeff: 'GAMMA0_TERRAIN', // terrain-corrected
              orthorectify: true,
            },
          },
        ],
      },
      output: {
        width: opts.width ?? 512,
        height: opts.height ?? 512,
        responses: [{ identifier: 'default', format: { type: 'image/tiff' } }],
      },
      evalscript: RADAR_EVALSCRIPT,
    };
    const res = await fetchWithTimeout(PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      timeoutMs: 30_000,
      retries: 2,
    });
    if (!res.ok) {
      throw new Error(`CDSE S-1 failed: ${res.status} ${await res.text()}`);
    }
    return res.arrayBuffer();
  }

  private async processRequest(
    polygon: GeoJSON.Polygon,
    dateFrom: string,
    dateTo: string,
    evalscript: string,
    opts: { width?: number; height?: number; maxCloudCoverage?: number } = {},
  ): Promise<ArrayBuffer> {
    const token = await this.getToken();
    const payload = {
      input: {
        bounds: {
          geometry: polygon,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [
          {
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: {
                from: `${dateFrom}T00:00:00Z`,
                to: `${dateTo}T23:59:59Z`,
              },
              maxCloudCoverage: opts.maxCloudCoverage ?? 30,
              // Wybierz najmniej zachmurzoną scenę z okna, nie najnowszą.
              mosaickingOrder: 'leastCC',
            },
          },
        ],
      },
      output: {
        width: opts.width ?? 512,
        height: opts.height ?? 512,
        responses: [
          { identifier: 'default', format: { type: 'image/tiff' } },
        ],
      },
      evalscript,
    };

    const res = await fetchWithTimeout(PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      timeoutMs: 30_000,
      retries: 2,
    });
    if (!res.ok) {
      throw new Error(`CDSE process failed: ${res.status} ${await res.text()}`);
    }
    return res.arrayBuffer();
  }

  /**
   * Zwraca kolorową heatmapę PNG dla warstwy (NDVI/NDRE/NDWI/SAVI/truecolor).
   * Używane jako nakładka na mapie MapLibre przez image source.
   */
  async fetchColorRampPng(
    polygon: GeoJSON.Polygon,
    layer: 'ndvi' | 'ndre' | 'ndwi' | 'savi' | 'truecolor',
    dateFrom: string,
    dateTo: string,
    opts: { width?: number; height?: number; maxCloudCoverage?: number } = {},
  ): Promise<ArrayBuffer> {
    const rampScripts: Record<string, string> = {
      ndvi: buildColorRampEvalscript('ndvi'),
      ndre: buildColorRampEvalscript('ndre'),
      ndwi: buildColorRampEvalscript('ndwi'),
      savi: buildColorRampEvalscript('savi'),
      truecolor: TRUE_COLOR_EVALSCRIPT,
    };
    const token = await this.getToken();
    const payload = {
      input: {
        bounds: {
          geometry: polygon,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [
          {
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: { from: `${dateFrom}T00:00:00Z`, to: `${dateTo}T23:59:59Z` },
              maxCloudCoverage: opts.maxCloudCoverage ?? 30,
              mosaickingOrder: 'leastCC',
            },
          },
        ],
      },
      output: {
        width: opts.width ?? 1024,
        height: opts.height ?? 1024,
        responses: [{ identifier: 'default', format: { type: 'image/png' } }],
      },
      evalscript: rampScripts[layer],
    };
    const res = await fetchWithTimeout(PROCESS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      timeoutMs: 30_000,
      retries: 2,
    });
    if (!res.ok) throw new Error(`CDSE PNG ${layer} failed: ${res.status} ${await res.text()}`);
    return res.arrayBuffer();
  }

  /**
   * True color PNG dla poligonu — używane w UI + do Gemma 4 image analysis.
   */
  async fetchTrueColorPng(
    polygon: GeoJSON.Polygon,
    dateFrom: string,
    dateTo: string,
    opts: { width?: number; height?: number; maxCloudCoverage?: number } = {},
  ): Promise<ArrayBuffer> {
    const token = await this.getToken();
    const payload = {
      input: {
        bounds: {
          geometry: polygon,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [
          {
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: {
                from: `${dateFrom}T00:00:00Z`,
                to: `${dateTo}T23:59:59Z`,
              },
              maxCloudCoverage: opts.maxCloudCoverage ?? 20,
              mosaickingOrder: 'leastCC',
            },
          },
        ],
      },
      output: {
        width: opts.width ?? 512,
        height: opts.height ?? 512,
        responses: [{ identifier: 'default', format: { type: 'image/png' } }],
      },
      evalscript: TRUE_COLOR_EVALSCRIPT,
    };

    const res = await fetchWithTimeout(PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      timeoutMs: 30_000,
      retries: 2,
    });
    if (!res.ok) {
      throw new Error(`CDSE true-color failed: ${res.status} ${await res.text()}`);
    }
    return res.arrayBuffer();
  }
}

/**
 * Dekoduje GeoTIFF z Copernicus do Float32Array wartości NDVI (1 band).
 */
export async function extractNdviValues(geotiffBuffer: ArrayBuffer): Promise<Float32Array> {
  const tiff = await fromArrayBuffer(geotiffBuffer);
  const image = await tiff.getImage();
  const raster = await image.readRasters({ interleave: false });
  const values = raster[0] as Float32Array;
  return values;
}

/**
 * Dekoduje multi-band GeoTIFF do 4 osobnych Float32Array (NDVI, NDRE, NDWI, SAVI).
 */
export async function extractMultiIndexValues(
  geotiffBuffer: ArrayBuffer,
): Promise<{
  ndvi: Float32Array;
  ndre: Float32Array;
  ndwi: Float32Array;
  savi: Float32Array;
}> {
  const tiff = await fromArrayBuffer(geotiffBuffer);
  const image = await tiff.getImage();
  const raster = await image.readRasters({ interleave: false });
  const bands = raster as unknown as Float32Array[];
  if (bands.length < 4) {
    throw new Error(`Oczekiwano 4 pasm, dostano ${bands.length}`);
  }
  return {
    ndvi: bands[0],
    ndre: bands[1],
    ndwi: bands[2],
    savi: bands[3],
  };
}

/**
 * Dekoduje 3-band GeoTIFF z Sentinel-1 (VV dB, VH dB, RVI).
 */
export async function extractRadarValues(
  geotiffBuffer: ArrayBuffer,
): Promise<{ vv: Float32Array; vh: Float32Array; rvi: Float32Array }> {
  const tiff = await fromArrayBuffer(geotiffBuffer);
  const image = await tiff.getImage();
  const raster = await image.readRasters({ interleave: false });
  const bands = raster as unknown as Float32Array[];
  if (bands.length < 3) {
    throw new Error(`Oczekiwano 3 pasm SAR, dostano ${bands.length}`);
  }
  return { vv: bands[0], vh: bands[1], rvi: bands[2] };
}

/**
 * Factory z env vars. Throws jeśli brak credentials.
 *
 * Singleton na poziomie modułu — dzięki temu cache tokenu OAuth (this.token)
 * przeżywa między żądaniami w ramach ciepłej lambdy, zamiast pobierać nowy token
 * przy każdym wejściu na mapę pola (patrz audyt 2. — perf CDSE).
 */
let cachedClient: CopernicusClient | null = null;
let cachedClientKey = '';

export function getCopernicusClient(): CopernicusClient {
  const id = process.env.CDSE_CLIENT_ID ?? '';
  const secret = process.env.CDSE_CLIENT_SECRET ?? '';
  const key = `${id}:${secret}`;
  if (!cachedClient || cachedClientKey !== key) {
    cachedClient = new CopernicusClient(id, secret);
    cachedClientKey = key;
  }
  return cachedClient;
}
