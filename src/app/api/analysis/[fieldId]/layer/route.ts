// GET /api/analysis/[fieldId]/layer?type=ndvi|ndre|ndwi|savi|truecolor
// Zwraca kolorową heatmapę PNG dla danej warstwy, gotową do nakładki na mapie.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient } from '@/lib/satellite/copernicus';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';
import { EO_LAYER_CACHE_HEADERS } from '@/lib/http/cache';
import { looksEmptyPng } from '@/lib/satellite/png';

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

  // Obraz z TEJ SAMEJ sceny co liczby obok (ostatni odczyt Sentinel-2, lib/satellite/scene).
  // Wcześniej mozaika 14 dni + observedAt = dziś: mapa i NDVI mogły być z różnych dni,
  // a podpis pod mapą kłamał datą.
  const latest = await prisma.ndviReading.findFirst({
    where: { fieldId: params.fieldId, source: 'sentinel-2', observedAt: { gte: new Date(from) } },
    orderBy: { observedAt: 'desc' },
    select: { observedAt: true },
  });
  let sceneDay = latest?.observedAt.toISOString().slice(0, 10) ?? null;
  // Starsze odczyty mają datę ANALIZY (now()), nie przelotu satelity — dla takiego dnia CDSE
  // nie ma sceny i zwraca pusty, przezroczysty PNG (miniatury znikały, zostawało jedno pole).
  // Dzień bez sceny w katalogu → wracamy do mozaiki z 14 dni.
  if (sceneDay) {
    const day = sceneDay;
    const scenes = await getCopernicusClient()
      .searchS2Scenes(polygon, day, day, 100)
      .catch(() => []);
    if (scenes.length === 0) sceneDay = null;
  }

  // ?size=N (miniatury) — mały kafel z PROPORCJAMI pola (koszt ~1/16 dużego).
  // Bez size: 1024×1024 dla nakładki mapy (MapLibre i tak rozciąga po bbox).
  const sizeParam = Number(req.nextUrl.searchParams.get('size'));
  const dims = (() => {
    if (!Number.isFinite(sizeParam) || sizeParam <= 0) return { width: 1024, height: 1024 };
    const side = Math.min(512, Math.max(64, Math.round(sizeParam)));
    const midLat = ((field.bbox_miny + field.bbox_maxy) / 2) * (Math.PI / 180);
    const wM = (field.bbox_maxx - field.bbox_minx) * 111320 * Math.cos(midLat);
    const hM = (field.bbox_maxy - field.bbox_miny) * 110574;
    if (wM <= 0 || hM <= 0) return { width: side, height: side };
    return wM >= hM
      ? { width: side, height: Math.max(16, Math.round((side * hM) / wM)) }
      : { width: Math.max(16, Math.round((side * wM) / hM)), height: side };
  })();

  try {
    const client = getCopernicusClient();
    let pngBuffer: ArrayBuffer | null = null;

    if (sceneDay) {
      // Dzień sceny już wybrany — nie odfiltrowuj go po zachmurzeniu kafla.
      const png = await client.fetchColorRampPng(polygon, type, sceneDay, sceneDay, {
        ...dims,
        maxCloudCoverage: 100,
      });
      // Scena istnieje w katalogu, ale pole bywa pod chmurą / poza pasem przelotu →
      // CDSE zwraca w pełni przezroczysty PNG (miniatura „znika"). Wtedy mozaika.
      if (looksEmptyPng(png.byteLength, dims.width, dims.height)) sceneDay = null;
      else pngBuffer = png;
    }
    if (!pngBuffer) {
      pngBuffer = await client.fetchColorRampPng(polygon, type, from, today, dims);
    }

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
        // Data przelotu sceny; null = mozaika z 14 dni (brak zapisanego odczytu).
        observedAt: sceneDay,
      },
      { headers: EO_LAYER_CACHE_HEADERS },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

