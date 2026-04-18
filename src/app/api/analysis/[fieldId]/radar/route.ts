// POST /api/analysis/[fieldId]/radar — analiza Sentinel-1 SAR.
// Radar widzi przez chmury — używamy gdy Sentinel-2 niedostępny w PL.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  getCopernicusClient,
  extractRadarValues,
} from '@/lib/satellite/copernicus';
import { computeRadarStats, interpretRadar } from '@/lib/satellite/radar';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';

export async function POST(
  _req: NextRequest,
  { params }: { params: { fieldId: string } },
) {
  const { user } = await requireAuth();

  const rows = await prisma.$queryRaw<
    Array<{ id: string; polygon: string; crop: string }>
  >`
    SELECT f.id, f.crop, ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.fieldId} AND fa.user_id = ${user.id}
  `;

  const field = rows[0];
  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 });
  }

  if (!isCopernicusConfigured()) {
    return NextResponse.json(
      {
        error: 'Radar wymaga Copernicus CDSE credentials (CDSE_CLIENT_ID/SECRET)',
        configRequired: 'CDSE_CLIENT_ID',
      },
      { status: 503 },
    );
  }

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const today = new Date().toISOString().slice(0, 10);
  const tenDaysAgo = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10);

  try {
    const tiff = await getCopernicusClient().fetchRadarGeotiff(
      polygon,
      tenDaysAgo,
      today,
    );
    const rasters = await extractRadarValues(tiff);
    const stats = computeRadarStats(rasters);
    // TODO: dociągnąć historical reading z DB gdy dodamy RadarReading model
    const interpretation = interpretRadar(stats, null);

    return NextResponse.json({
      fieldId: field.id,
      observedAt: today,
      radar: {
        vv: { mean: stats.vv.mean, min: stats.vv.min, max: stats.vv.max },
        vh: { mean: stats.vh.mean, min: stats.vh.min, max: stats.vh.max },
        rvi: { mean: stats.rvi.mean, min: stats.rvi.min, max: stats.rvi.max },
      },
      interpretation,
      note: 'Sentinel-1 radar — widzi przez chmury. Używaj gdy Sentinel-2 optyczne niedostępne (>30% chmur) albo dla wykrywania szkód mechanicznych.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Nie udało się pobrać SAR', details: String(err) },
      { status: 502 },
    );
  }
}
