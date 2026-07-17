// POST /api/fields/[id]/radar-history/backfill?months=6
// Uzupełnia historię backscatteru Sentinel-1 dla pola.
//
// PO CO: wilgotność gleby liczymy metodą detekcji zmian — referencje „sucho/mokro"
// to percentyle z historii TEGO pola. Bez backfillu funkcja milczy przez ~7 tygodni
// (potrzeba ≥8 przejść, a rewizyta S1 to ~6 dni). Backfill daje ją od razu.
//
// Okna 12-dniowe (~2 przejścia S1) — kompromis: dość gęsto, by złapać zmienność
// wilgotności, dość rzadko, by nie palić limitu CDSE (6 mies. ≈ 15 zapytań/pole).

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractRadarValues } from '@/lib/satellite/copernicus';
import { computeRadarStats } from '@/lib/satellite/radar';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';

export const maxDuration = 300;

const WINDOW_DAYS = 12;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  const monthsRaw = parseInt(req.nextUrl.searchParams.get('months') ?? '6', 10);
  const months = Number.isFinite(monthsRaw) ? Math.max(1, Math.min(12, monthsRaw)) : 6;

  if (!isCopernicusConfigured()) {
    return NextResponse.json({ error: 'Backfill wymaga CDSE credentials' }, { status: 503 });
  }

  const rows = await prisma.$queryRaw<Array<{ id: string; polygon: string }>>`
    SELECT f.id, ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.id} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const client = getCopernicusClient();

  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);

  // Pomiń okna, które już mamy — backfill musi być idempotentny (można kliknąć 2×).
  const existing = await prisma.radarReading.findMany({
    where: { fieldId: field.id, observedAt: { gte: start, lte: end } },
    select: { observedAt: true },
  });
  const haveDays = new Set(existing.map((r) => r.observedAt.toISOString().slice(0, 10)));

  const windows: Array<{ from: string; to: string; mid: string }> = [];
  const cur = new Date(start);
  while (cur < end) {
    const from = new Date(cur);
    const to = new Date(cur);
    to.setDate(to.getDate() + WINDOW_DAYS - 1);
    if (to > end) to.setTime(end.getTime());
    const mid = new Date((from.getTime() + to.getTime()) / 2).toISOString().slice(0, 10);
    if (!haveDays.has(mid)) {
      windows.push({
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        mid,
      });
    }
    cur.setDate(cur.getDate() + WINDOW_DAYS);
  }

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const w of windows) {
    try {
      const tiff = await client.fetchRadarGeotiff(polygon, w.from, w.to);
      const rasters = await extractRadarValues(tiff);
      const stats = computeRadarStats(rasters);
      // Brak walidnych pikseli (poza footprintem / brak przejścia) — pomijamy,
      // zamiast zapisywać NaN, który zatrułby percentyle referencyjne.
      if (stats.vv.validCount === 0 || !Number.isFinite(stats.vv.mean)) continue;

      const observedAt = new Date(`${w.mid}T00:00:00Z`);
      await prisma.radarReading.upsert({
        where: { fieldId_observedAt: { fieldId: field.id, observedAt } },
        create: {
          fieldId: field.id,
          observedAt,
          vvMean: stats.vv.mean,
          vhMean: stats.vh.mean,
          rviMean: stats.rvi.mean,
        },
        update: { vvMean: stats.vv.mean, vhMean: stats.vh.mean, rviMean: stats.rvi.mean },
      });
      processed++;
    } catch (err) {
      failed++;
      errors.push(`${w.mid}: ${String(err).slice(0, 80)}`);
      // Nie przerywamy — pojedyncze okna bez przejścia S1 są normalne.
    }
  }

  const total = await prisma.radarReading.count({ where: { fieldId: field.id } });

  return NextResponse.json({
    fieldId: field.id,
    requestedMonths: months,
    windowsChecked: windows.length,
    processed,
    failed,
    totalHistory: total,
    errors: errors.slice(0, 5),
  });
}
