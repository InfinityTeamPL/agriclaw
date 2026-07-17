// GET /api/analysis/[fieldId]/layer?type=ndvi|ndre|ndwi|savi|truecolor
// Zwraca kolorową heatmapę PNG dla danej warstwy, gotową do nakładki na mapie.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient } from '@/lib/satellite/copernicus';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';
import { EO_LAYER_CACHE_HEADERS } from '@/lib/http/cache';

const VALID_LAYERS = ['ndvi', 'ndre', 'ndwi', 'savi', 'truecolor'] as const;
type Layer = (typeof VALID_LAYERS)[number];

export async function GET(
  req: NextRequest,
  { params }: { params: { fieldId: string } },
) {
  const { user } = await requireAuth();

  const type = (req.nextUrl.searchParams.get('type') ?? 'ndvi') as Layer;
  if (!VALID_LAYERS.includes(type)) {
    return NextResponse.json({ error: 'Nieznana warstwa' }, { status: 400 });
  }

  if (!isCopernicusConfigured()) {
    return NextResponse.json(
      { error: 'CDSE credentials brak — mock nie obsługiwany dla warstw PNG' },
      { status: 503 },
    );
  }

  const rows = await prisma.$queryRaw<
    Array<{ polygon: string; bbox_minx: number; bbox_miny: number; bbox_maxx: number; bbox_maxy: number }>
  >`
    SELECT ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_XMin(f.polygon) AS bbox_minx, ST_YMin(f.polygon) AS bbox_miny,
           ST_XMax(f.polygon) AS bbox_maxx, ST_YMax(f.polygon) AS bbox_maxy
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.fieldId} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);

  try {
    const pngBuffer = await getCopernicusClient().fetchColorRampPng(
      polygon,
      type,
      from,
      today,
      { width: 1024, height: 1024 },
    );

    // Zwróć metadane bbox + base64 PNG, żeby klient mógł umieścić na mapie
    const base64 = Buffer.from(pngBuffer).toString('base64');
    return NextResponse.json(
      {
        type,
        bbox: {
          minLon: field.bbox_minx,
          minLat: field.bbox_miny,
          maxLon: field.bbox_maxx,
          maxLat: field.bbox_maxy,
        },
        dataUrl: `data:image/png;base64,${base64}`,
        observedAt: today,
      },
      { headers: EO_LAYER_CACHE_HEADERS },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
