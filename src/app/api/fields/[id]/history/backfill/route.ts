// POST /api/fields/[id]/history/backfill?years=5
// Pobiera z CDSE miesięczne NDVI dla pola przez N lat wstecz.
// Max duration 300s (Vercel config). 60 zapytań CDSE per 5 lat.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractNdviValues } from '@/lib/satellite/copernicus';
import { computeNdviStats } from '@/lib/satellite/ndvi';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';

export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  // Guard na ?years=abc → parseInt daje NaN, które przenikało do dat i dawało
  // Invalid Date → 500 z Prisma. Nieparsowalne / poza zakresem → domyślne 5 lat.
  const yearsRaw = parseInt(req.nextUrl.searchParams.get('years') ?? '5', 10);
  const years = Number.isFinite(yearsRaw) ? Math.max(1, Math.min(10, yearsRaw)) : 5;

  if (!isCopernicusConfigured()) {
    return NextResponse.json(
      { error: 'Backfill wymaga CDSE credentials' },
      { status: 503 },
    );
  }

  const rows = await prisma.$queryRaw<
    Array<{ id: string; polygon: string; centroid_lat: number; centroid_lon: number }>
  >`
    SELECT f.id, ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_Y(ST_Centroid(f.polygon)) AS centroid_lat,
           ST_X(ST_Centroid(f.polygon)) AS centroid_lon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.id} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const client = getCopernicusClient();

  // Sentinel-2 od czerwca 2015, clamp
  const earliestDate = new Date('2015-06-01');
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - years);
  if (start < earliestDate) start.setTime(earliestDate.getTime());

  // Znajdź miesiące do uzupełnienia (NIE mamy ich już w NdviReading)
  const existing = await prisma.ndviReading.findMany({
    where: { fieldId: field.id, observedAt: { gte: start, lte: end } },
    select: { observedAt: true },
  });
  const haveMonths = new Set(
    existing.map((r) => r.observedAt.toISOString().slice(0, 7)),
  );

  const monthsToFetch: Array<{ from: string; to: string; key: string }> = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 7);
    if (!haveMonths.has(key)) {
      const from = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const to = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      monthsToFetch.push({
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        key,
      });
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  // Pobierz z CDSE — sekwencyjnie żeby nie uderzyć rate limitów
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const m of monthsToFetch) {
    try {
      const tiff = await client.fetchNdviGeotiff(polygon, m.from, m.to, {
        maxCloudCoverage: 50, // dla historii tolerujemy więcej chmur
      });
      const values = await extractNdviValues(tiff);
      const stats = computeNdviStats(values);
      if (stats.validCount === 0) continue;

      // Zapisz z datą środka miesiąca (przybliżenie)
      const observedAt = new Date(`${m.key}-15T12:00:00Z`);
      await prisma.ndviReading.create({
        data: {
          fieldId: field.id,
          observedAt,
          ndviMean: stats.mean,
          ndviMin: stats.min,
          ndviMax: stats.max,
          validCount: stats.validCount,
          cloudCover: 0,
          source: 'sentinel-2-history',
        },
      });
      processed++;
    } catch (err) {
      failed++;
      errors.push(`${m.key}: ${String(err).slice(0, 80)}`);
      // Nie przerywamy — niektóre miesiące mogą nie mieć dostępnych zdjęć
    }
  }

  return NextResponse.json({
    fieldId: field.id,
    requestedYears: years,
    monthsChecked: monthsToFetch.length,
    processed,
    failed,
    errors: errors.slice(0, 5),
  });
}
