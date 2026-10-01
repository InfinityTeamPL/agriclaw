// POST /api/analysis/[fieldId]/thermal — Landsat 8/9 surface temperature.
// Temperatura powierzchni to wczesny wskaźnik stresu termicznego —
// roślina przegrzewa się zanim NDVI zacznie spadać.
//
// Źródło główne: Microsoft Planetary Computer (darmowe, bez klucza) — darmowe
// konto CDSE NIE ma dostępu do Landsat, przez co ten kafelek zawsze zwracał 503.
// CDSE zostaje jako zapas dla kont z subskrypcją Landsat.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractNdviValues } from '@/lib/satellite/copernicus';
import { computeNdviStats } from '@/lib/satellite/ndvi';
import { isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';
import { fetchLandsatThermalPC } from '@/lib/satellite/landsat-pc';
import { ADVISORY_SHORT } from '@/lib/advisory';

// Rewizyta Landsat 8+9 to ~8 dni, ale chmury często zasłaniają kolejne przeloty —
// 32 dni dają realną szansę na bezchmurną scenę nad polem.
const WINDOW_DAYS = 32;

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
    LIMIT 1
  `;
  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString().slice(0, 10);

  let values: Float32Array | null = null;
  let source = '';
  let observedAt = today;
  let sceneCloudCover: number | null = null;

  // 1) Planetary Computer (darmowe)
  try {
    const pc = await fetchLandsatThermalPC(polygon, from, today);
    if (pc) {
      values = pc.values;
      observedAt = pc.acquiredAt.slice(0, 10) || today;
      sceneCloudCover = pc.cloudCover;
      source = `${pc.platform} C2 L2 · Microsoft Planetary Computer (${pc.sceneId})`;
    }
  } catch (err) {
    console.error('thermal: Planetary Computer niedostępny:', err);
  }

  // 2) Zapas: CDSE (tylko konta z Landsat w subskrypcji)
  if (!values && isCopernicusConfigured()) {
    try {
      const tiff = await getCopernicusClient().fetchLandsatThermalGeotiff(polygon, from, today);
      const v = await extractNdviValues(tiff);
      if (computeNdviStats(v).validCount > 0) {
        values = v;
        source = 'landsat-ot-l2 (8/9) · Copernicus CDSE';
      }
    } catch {
      /* darmowe CDSE nie ma Landsat — oczekiwane, nie logujemy jako błąd */
    }
  }

  if (!values || values.length === 0) {
    return NextResponse.json(
      {
        error: `Brak bezchmurnej sceny Landsat nad tym polem w ostatnich ${WINDOW_DAYS} dniach (zachmurzenie). Radar Sentinel-1 widzi przez chmury — sprawdź kafelek radaru.`,
      },
      { status: 502 },
    );
  }

  const stats = computeNdviStats(values);
  const avgTemp = stats.mean;
  const spread = stats.max - stats.min;

  // Interpretacja — wsparcie decyzji, nie polecenie (zasada z recenzji eksperckiej).
  let status: 'high' | 'elevated' | 'cold' | 'normal';
  let diagnosis: string;
  let action: string;
  if (avgTemp > 35) {
    status = 'high';
    diagnosis = `Temperatura powierzchni ${avgTemp.toFixed(1)}°C — silny stres cieplny; rośliny ograniczają transpirację i fotosyntezę.`;
    action = `Rozważ nawadnianie wieczorem, jeśli masz taką możliwość. Unikaj zabiegów ŚOR w upale (>25–28°C — ryzyko fitotoksyczności i znoszenia). ${ADVISORY_SHORT}`;
  } else if (avgTemp > 28) {
    status = 'elevated';
    diagnosis = `${avgTemp.toFixed(1)}°C — podwyższona temperatura, rośliny tracą więcej wody.`;
    action = 'Sprawdź wilgotność gleby (radar / łopata). Przy przesychaniu rozważ nawadnianie w ciągu 48 h.';
  } else if (avgTemp < 5) {
    status = 'cold';
    diagnosis = `${avgTemp.toFixed(1)}°C — chłodna powierzchnia; uprawy ciepłolubne (kukurydza, ziemniaki) są wrażliwe na przymrozek.`;
    action = 'Sprawdź prognozę nocną w kafelku przymrozków.';
  } else {
    status = 'normal';
    diagnosis = `${avgTemp.toFixed(1)}°C — temperatura w normie dla sezonu.`;
    action = 'Brak potrzeby działania. Kolejny przelot Landsat za ~8 dni.';
  }

  // Różnica w obrębie pola = heterogeniczność stresu (strefy).
  if (spread > 8) {
    action += ` Różnica ${spread.toFixed(1)}°C między najchłodniejszą a najcieplejszą częścią pola — pole ma strefy o różnym stresie (gleba, pokrycie łanu).`;
  }

  return NextResponse.json({
    fieldId: field.id,
    observedAt,
    thermal: {
      meanC: stats.mean,
      minC: stats.min,
      maxC: stats.max,
      spread,
      validCount: stats.validCount,
    },
    interpretation: { status, diagnosis, action },
    source,
    sceneCloudCover,
  });
}
