// Copernicus Data Space Ecosystem client
// - OAuth2 client_credentials do token
// - Process API → NDVI GeoTIFF dla polygonu
// - ExtractNdviValues → Float32Array do computeNdviStats
//
// Docs: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html

import { fromArrayBuffer } from 'geotiff';

const TOKEN_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0) return [NaN];
  return [(s.B08 - s.B04) / (s.B08 + s.B04)];
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
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
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
      evalscript: NDVI_EVALSCRIPT,
    };

    const res = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`CDSE process failed: ${res.status} ${await res.text()}`);
    }
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

    const res = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
 * Factory z env vars. Throws jeśli brak credentials.
 */
export function getCopernicusClient(): CopernicusClient {
  return new CopernicusClient(
    process.env.CDSE_CLIENT_ID ?? '',
    process.env.CDSE_CLIENT_SECRET ?? '',
  );
}
