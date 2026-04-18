// Strona startowa dashboard — podsumowanie gospodarstwa.
// Hero stats (animowane liczniki) + mini mapa farmy + karty pól z sparkline NDVI
// + stream ostatnich zdarzeń / rekomendacji.

import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { evaluateCompliance } from '@/lib/compliance';
import { DashboardHomeClient } from './DashboardHomeClient';

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
    WHERE f.farm_id = ${farm.id}
    ORDER BY f.created_at DESC
  `;

  const fieldIds = fields.map((f) => f.id);

  const readings = fieldIds.length
    ? await prisma.ndviReading.findMany({
        where: { fieldId: { in: fieldIds } },
        orderBy: { observedAt: 'desc' },
        take: 200,
      })
    : [];

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
  const activeAlerts = recentRecs.filter((r) => r.severity !== 'none').length;
  const latestReading = readings[0];

  // Compliance — mini score do pokazania w dashboard home
  const treatmentCounts = fieldIds.length
    ? await prisma.treatment.groupBy({
        by: ['fieldId'],
        where: {
          fieldId: { in: fieldIds },
          performedAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
        },
        _count: true,
      })
    : [];
  const treatmentCountByField = new Map(
    treatmentCounts.map((t) => [t.fieldId, t._count]),
  );
  const complianceReport = evaluateCompliance({
    totalHectares: totalHa,
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: Number(f.area_hectares),
      treatmentsCountThisSeason: treatmentCountByField.get(f.id) ?? 0,
      lastTreatmentAt: null,
    })),
  });

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
