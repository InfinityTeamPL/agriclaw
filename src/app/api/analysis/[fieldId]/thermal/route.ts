// POST /api/analysis/[fieldId]/thermal — Landsat 8/9 surface temperature.
// Temperatura liścia to wczesny wskaźnik stresu termicznego —
// roślina przegrzewa się zanim NDVI zacznie spadać.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractNdviValues } from '@/lib/satellite/copernicus';
import { computeNdviStats } from '@/lib/satellite/ndvi';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';

export async function POST(
  _req: NextRequest,
  { params }: { params: { fieldId: string } },
) {
  const { user } = await requireAuth();

  if (!isCopernicusConfigured()) {
    return NextResponse.json(
      { error: 'Landsat thermal wymaga CDSE credentials' },
      { status: 503 },
    );
  }

  const rows = await prisma.$queryRaw<
    Array<{ id: string; polygon: string; crop: string }>
  >`
    SELECT f.id, f.crop, ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.fieldId} AND fa.user_id = ${user.id}
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const today = new Date().toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);

  try {
    const tiff = await getCopernicusClient().fetchLandsatThermalGeotiff(
      polygon,
      fourteenDaysAgo,
      today,
    );
    const values = await extractNdviValues(tiff); // Float32Array re-use
    const stats = computeNdviStats(values);

    // Interpretacja
    let status = 'normal';
    let diagnosis = '';
    let action = '';

    const avgTemp = stats.mean;
    if (Number.isNaN(avgTemp) || stats.validCount === 0) {
      return NextResponse.json({
        error: 'Brak danych Landsat (prawdopodobnie zachmurzenie). Spróbuj Sentinel-2 albo za 4-5 dni.',
      }, { status: 502 });
    }

    if (avgTemp > 35) {
      status = 'high';
      diagnosis = `Temperatura powierzchni liścia ${avgTemp.toFixed(1)}°C — silny stres cieplny, aparaty szparkowe zamknięte, fotosynteza zatrzymana.`;
      action = 'Pilne nawadnianie wieczorne. Przy braku nawadniania — oprysk antytranspirantem (np. Vapor Gard 4 l/ha). Unikaj oprysków ŚOR przy temperaturze >28°C (fitotoksyczność).';
    } else if (avgTemp > 28) {
      status = 'elevated';
      diagnosis = `${avgTemp.toFixed(1)}°C — podwyższona temperatura, rośliny tracą więcej wody.`;
      action = 'Sprawdź wilgotność gleby. Rozważ nawadnianie w ciągu 48h.';
    } else if (avgTemp < 5) {
      status = 'cold';
      diagnosis = `${avgTemp.toFixed(1)}°C — ryzyko przymrozków. Kukurydza i ziemniaki wrażliwe.`;
      action = 'Monitoruj prognozę nocną (Open-Meteo). Przy prognozie <0°C: nawadnianie prewencyjne podnosi temperaturę powierzchni o 2-3°C.';
    } else {
      status = 'normal';
      diagnosis = `${avgTemp.toFixed(1)}°C — temperatura w normie dla sezonu.`;
      action = 'Brak akcji. Monitoruj co 8 dni (rewizyta Landsat).';
    }

    // Różnica max-min w obrębie pola = heterogeniczność stresu
    const spread = stats.max - stats.min;
    if (spread > 8) {
      action +=
        ` Różnica ${spread.toFixed(1)}°C między najchłodniejszym a najcieplejszym pikselem — pole ma strefy o różnym stresie, sprawdź zróżnicowanie pokrywy gleby.`;
    }

    return NextResponse.json({
      fieldId: field.id,
      observedAt: today,
      thermal: {
        meanC: stats.mean,
        minC: stats.min,
        maxC: stats.max,
        spread: stats.max - stats.min,
        validCount: stats.validCount,
      },
      interpretation: { status, diagnosis, action },
      source: 'landsat-ot-l2 (8/9 combined)',
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err).slice(0, 300) },
      { status: 502 },
    );
  }
}
