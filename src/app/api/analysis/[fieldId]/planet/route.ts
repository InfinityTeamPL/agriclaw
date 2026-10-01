// GET /api/analysis/[fieldId]/planet — najnowsze zdjęcie Planet PSScene (3m) dla pola.
// Zwraca thumbnail jako dataURL + bbox geometrii sceny dla image overlay na mapie.
// Thumbnail jest DARMOWY — nie zużywa kredytów Planet.
//
// UWAGA: thumbnail to CAŁA scena (~25×40 km) w 512 px, czyli ~50–80 m/piksel — NIE 3 m.
// Pełne 3 m wymaga licencji Tiles/Orders (obecny klucz: tiles → 401 „No Permission", 10.2026).
// Dlatego zwracamy prawdziwą rozdzielczość podglądu + bbox pola do zaznaczenia go na obrazie.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { searchPlanetItems, fetchPlanetThumbnail, polygonBbox, isPlanetConfigured } from '@/lib/satellite/planet';

export const maxDuration = 60;

/** Szerokość thumbnaila (lib/satellite/planet → ?width=512). */
const THUMB_WIDTH_PX = 512;

export async function GET(
  _req: NextRequest,
  { params }: { params: { fieldId: string } },
) {
  const { user } = await requireAuth();

  if (!isPlanetConfigured()) {
    return NextResponse.json(
      { error: 'Planet API nie jest skonfigurowany (brak PLANET_API_KEY)' },
      { status: 503 },
    );
  }

  const rows = await prisma.$queryRaw<
    Array<{ id: string; polygon: string }>
  >`
    SELECT f.id, ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.fieldId} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  try {
    const items = await searchPlanetItems(
      process.env.PLANET_API_KEY!,
      polygon,
      monthAgo,
      today,
      0.3,
      5,
    );

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Brak dostępnych zdjęć Planet dla tego pola w ostatnich 30 dniach (z chmurami <30%)' },
        { status: 404 },
      );
    }

    const latest = items[0];
    const { dataUrl, bytes } = await fetchPlanetThumbnail(process.env.PLANET_API_KEY!, latest);
    const bbox = polygonBbox(latest.geometry);
    const fieldBbox = polygonBbox(polygon);
    const midLat = (((bbox.minLat + bbox.maxLat) / 2) * Math.PI) / 180;
    const sceneWidthM = (bbox.maxLon - bbox.minLon) * 111_320 * Math.cos(midLat);
    const previewMetersPerPixel = Math.round(sceneWidthM / THUMB_WIDTH_PX);

    return NextResponse.json({
      type: 'planet',
      provider: 'Planet Labs PSScene',
      resolution: `~${previewMetersPerPixel} m/piksel`,
      sensorResolution: '3 m',
      previewMetersPerPixel,
      fieldBbox,
      itemId: latest.id,
      observedAt: latest.acquired,
      cloudCover: latest.cloudCover,
      bbox,
      dataUrl,
      sizeBytes: bytes,
      alternativesCount: items.length - 1,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err) },
      { status: 502 },
    );
  }
}
