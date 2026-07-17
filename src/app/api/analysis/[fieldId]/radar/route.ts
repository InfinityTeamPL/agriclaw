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
import {
  computeSoilMoistureS1,
  describeSoilMoistureS1,
  MIN_HISTORY_FOR_REFERENCE,
} from '@/lib/satellite/soil-moisture-s1';

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
    WHERE f.id = ${params.fieldId} AND fa.user_id = ${user.id} AND f.deleted_at IS NULL
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

    // Zapisz obserwację (idempotentnie na dzień) — historia VV jest paliwem
    // dla referencji sucho/mokro przy liczeniu wilgotności gleby.
    const observedAt = new Date(`${today}T00:00:00Z`);
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

    // Historia BEZ dzisiejszego odczytu — bieżący punkt nie może współtworzyć
    // własnych referencji.
    const [history, lastNdvi, prevRadar] = await Promise.all([
      prisma.radarReading.findMany({
        where: { fieldId: field.id, observedAt: { lt: observedAt } },
        orderBy: { observedAt: 'desc' },
        take: 60,
        select: { vvMean: true },
      }),
      prisma.ndviReading.findFirst({
        where: { fieldId: field.id },
        orderBy: { observedAt: 'desc' },
        select: { ndviMean: true },
      }),
      prisma.radarReading.findFirst({
        where: { fieldId: field.id, observedAt: { lt: observedAt } },
        orderBy: { observedAt: 'desc' },
        select: { vvMean: true, vhMean: true, rviMean: true, observedAt: true },
      }),
    ]);

    const interpretation = interpretRadar(
      stats,
      prevRadar ? { vv: prevRadar.vvMean, vh: prevRadar.vhMean } : null,
    );

    const moisture = computeSoilMoistureS1(
      stats.vv.mean,
      history.map((h) => h.vvMean),
      lastNdvi?.ndviMean ?? null,
    );

    // Utrwalamy wyłącznie realnie policzony odczyt — brak historii NIE może
    // trafić do bazy jako zmyślona liczba (zasada: nie udawaj pomiaru).
    // Idempotentnie na dzień: rolnik może kliknąć „Sprawdź" kilka razy, a to
    // nie może mnożyć wpisów w historii wilgotności.
    if (moisture) {
      const already = await prisma.soilMoistureReading.findFirst({
        where: { fieldId: field.id, observedAt, source: 'sentinel1-cd' },
        select: { id: true },
      });
      if (already) {
        await prisma.soilMoistureReading.update({
          where: { id: already.id },
          data: { moisturePct: moisture.relativePct },
        });
      } else {
        await prisma.soilMoistureReading.create({
          data: {
            fieldId: field.id,
            observedAt,
            moisturePct: moisture.relativePct,
            source: 'sentinel1-cd',
          },
        });
      }
    }

    return NextResponse.json({
      fieldId: field.id,
      observedAt: today,
      radar: {
        vv: { mean: stats.vv.mean, min: stats.vv.min, max: stats.vv.max },
        vh: { mean: stats.vh.mean, min: stats.vh.min, max: stats.vh.max },
        rvi: { mean: stats.rvi.mean, min: stats.rvi.min, max: stats.rvi.max },
      },
      interpretation,
      soilMoisture: moisture
        ? {
            ...moisture,
            summary: describeSoilMoistureS1(moisture),
            // Jawnie: to NIE jest pomiar objętościowy m³/m³.
            kind: 'relative-to-field-history',
          }
        : {
            unavailable: true,
            reason:
              history.length < MIN_HISTORY_FOR_REFERENCE
                ? `Zbieram historię radarową (${history.length}/${MIN_HISTORY_FOR_REFERENCE} obserwacji). Wilgotność pojawi się, gdy będzie z czym porównać.`
                : 'To pole ma zbyt małą zmienność sygnału radarowego, żeby wiarygodnie ocenić wilgotność.',
          },
      note: 'Sentinel-1 radar — widzi przez chmury. Używaj gdy Sentinel-2 optyczne niedostępne (>30% chmur) albo dla wykrywania szkód mechanicznych.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Nie udało się pobrać SAR', details: String(err) },
      { status: 502 },
    );
  }
}
