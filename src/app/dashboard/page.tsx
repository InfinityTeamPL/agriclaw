// Strona startowa dashboard — podsumowanie gospodarstwa.
// Hero stats (animowane liczniki) + mini mapa farmy + karty pól z sparkline NDVI
// + stream ostatnich zdarzeń / rekomendacji.

import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { loadComplianceReport } from '@/lib/compliance-data';
import { fetchWeatherForecast, fetchSprayForecast } from '@/lib/satellite/weather';
import { DashboardHomeClient } from './DashboardHomeClient';
import { topReason } from '@/lib/why';

export const dynamic = 'force-dynamic';

interface FieldRow {
  id: string;
  name: string;
  crop: string;
  area_hectares: number;
  created_at: Date;
  polygon: string;
  centroid_lat: number;
  centroid_lon: number;
}

export default async function DashboardHome() {
  const { farm } = await requireFarm();

  const fields = await prisma.$queryRaw<FieldRow[]>`
    SELECT f.id, f.name, f.crop, f.area_hectares, f.created_at,
           ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_Y(ST_Centroid(f.polygon)) AS centroid_lat,
           ST_X(ST_Centroid(f.polygon)) AS centroid_lon
    FROM "fields" f
    WHERE f.farm_id = ${farm.id} AND f.deleted_at IS NULL
    ORDER BY f.created_at DESC
  `;

  const fieldIds = fields.map((f) => f.id);

  // Ostatnie odczyty KAŻDEGO pola (wcześniej jedno globalne take: 200 — przy wielu polach lub po
  // backfillu starsze pola traciły sparkline i pokazywały „Brak analizy"). Bez odczytów mock.
  const readings = (
    await Promise.all(
      fieldIds.map((id) =>
        prisma.ndviReading.findMany({
          where: { fieldId: id, source: { not: 'mock' } },
          orderBy: { observedAt: 'desc' },
          take: 30,
        }),
      ),
    )
  )
    .flat()
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());

  const ndviByField = new Map<string, { mean: number; observedAt: Date }[]>();
  for (const r of readings) {
    if (!ndviByField.has(r.fieldId)) ndviByField.set(r.fieldId, []);
    ndviByField.get(r.fieldId)!.push({ mean: r.ndviMean, observedAt: r.observedAt });
  }

  const recentRecs = fieldIds.length
    ? await prisma.recommendation.findMany({
        where: { fieldId: { in: fieldIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          field: { select: { id: true, name: true } },
        },
      })
    : [];

  const recentEvents = await prisma.event.findMany({
    where: { farmId: farm.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const totalHa = fields.reduce((acc, f) => acc + Number(f.area_hectares), 0);

  // „Wymaga uwagi" = NAJNOWSZA rekomendacja każdego pola (nie 5 ostatnich wpisów
  // z duplikatami). Jedno źródło prawdy dla zdania nagłówka, listy i licznika —
  // wcześniej baner mówił „brak pilnych", a kafelek obok „5 pilnych".
  const latestRecPerField = fieldIds.length
    ? await prisma.recommendation.findMany({
        where: { fieldId: { in: fieldIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['fieldId'],
        include: { field: { select: { id: true, name: true } } },
      })
    : [];
  const SEV_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
  // Sygnał starszy niż 14 dni to historia, a nie „dziś" (wcześniej lipcowy
  // stres cieplny wisiał jako pilny w październiku).
  const freshSince = Date.now() - 14 * 864e5;
  const attention = latestRecPerField
    .filter((r) => (SEV_RANK[r.severity] ?? 0) >= 1 && r.createdAt.getTime() >= freshSince)
    .sort(
      (a, b) =>
        (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
  const activeAlerts = attention.length;

  // Pogoda dla siedziby gospodarstwa — nie blokuje strony dłużej niż 2,5 s.
  const withTimeout = <T,>(p: Promise<T>, ms: number) =>
    Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
  const [weatherRes, sprayRes] = await Promise.allSettled([
    withTimeout(fetchWeatherForecast(farm.lat, farm.lon, 3), 2500),
    withTimeout(fetchSprayForecast(farm.lat, farm.lon), 2500),
  ]);
  const weather = weatherRes.status === 'fulfilled' ? weatherRes.value : null;
  const spray = sprayRes.status === 'fulfilled' ? sprayRes.value : null;
  const today = weather?.daily
    ? {
        tempMax: weather.daily.tempMax[0],
        tempMin: weather.daily.tempMin[0],
        precip: weather.daily.precipitation[0],
        windMax: weather.daily.windMaxKmh[0],
        precipNext3: weather.daily.precipitation.slice(0, 3).reduce((a, b) => a + b, 0),
        days: weather.daily.dates.slice(0, 3).map((d, i) => ({
          date: d,
          tempMax: weather.daily.tempMax[i],
          tempMin: weather.daily.tempMin[i],
          precip: weather.daily.precipitation[i],
        })),
      }
    : null;
  const sprayWindow = spray?.topWindows?.[0]
    ? { label: spray.topWindows[0].label, quality: spray.topWindows[0].quality }
    : null;
  const latestReading = readings[0];

  // Zgodność: ten sam loader co strona /dashboard/compliance (spójny wynik).
  const { report: complianceReport } = await loadComplianceReport(farm.id);

  const fieldsForClient = fields.map((f) => {
    const history = ndviByField.get(f.id) ?? [];
    const latest = history[0];
    return {
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: Number(f.area_hectares),
      createdAt: f.created_at.toISOString(),
      polygon: JSON.parse(f.polygon) as GeoJSON.Polygon,
      centroid: {
        lat: Number(f.centroid_lat),
        lon: Number(f.centroid_lon),
      },
      ndviMean: latest?.mean ?? null,
      ndviObservedAt: latest?.observedAt.toISOString() ?? null,
      ndviSeries: history
        .slice(0, 12)
        .map((r) => r.mean)
        .reverse(),
    };
  });

  return (
    <DashboardHomeClient
      farm={{
        id: farm.id,
        name: farm.name,
        address: farm.address,
        center: { lat: farm.lat, lon: farm.lon },
      }}
      fields={fieldsForClient}
      stats={{
        fieldsCount: fields.length,
        totalHa,
        activeAlerts,
        lastAnalysisAt: latestReading?.observedAt.toISOString() ?? null,
        complianceScore: complianceReport.score,
        complianceFails: complianceReport.failCount,
        complianceWarns: complianceReport.warnCount,
      }}
      recentRecs={recentRecs.map((r) => ({
        id: r.id,
        fieldId: r.fieldId,
        fieldName: r.field.name,
        severity: r.severity,
        title: r.title,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      }))}
      attention={attention.slice(0, 8).map((r) => ({
        id: r.id,
        fieldId: r.fieldId,
        fieldName: r.field.name,
        severity: r.severity,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
        ndviMean: ndviByField.get(r.fieldId)?.[0]?.mean ?? null,
        reason: topReason(r.why),
      }))}
      weather={today}
      sprayWindow={sprayWindow}
      recentEvents={recentEvents.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        detail: e.detail,
        createdAt: e.createdAt.toISOString(),
      }))}
    />
  );
}

