// Szczegóły pojedynczego pola.
// Server component: ładuje pole, NDVI history, rekomendacje, centroidy.
// Render delegowany do FieldDetailView (client).

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { FieldDetailView } from './FieldDetailView';

export const dynamic = 'force-dynamic';

interface FieldRow {
  id: string;
  farm_id: string;
  name: string;
  crop: string;
  area_hectares: number;
  polygon: string;
  centroid_lat: number;
  centroid_lon: number;
  created_at: Date;
}

export default async function FieldDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Next.js 14 — params może być Promise w niektórych konfiguracjach,
  // ale w sync trybie `await` na plain obiekcie jest no-op. Trzymamy obie wersje bezpieczne.
  const resolved = await Promise.resolve(params);
  const fieldId = resolved.id;

  const { farm } = await requireFarm();

  const rows = await prisma.$queryRaw<FieldRow[]>`
    SELECT f.id, f.farm_id, f.name, f.crop, f.area_hectares, f.created_at,
           ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_Y(ST_Centroid(f.polygon)) AS centroid_lat,
           ST_X(ST_Centroid(f.polygon)) AS centroid_lon
    FROM "fields" f
    WHERE f.id = ${fieldId} AND f.farm_id = ${farm.id} AND f.deleted_at IS NULL
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    notFound();
  }

  const ndviHistory = await prisma.ndviReading.findMany({
    where: { fieldId: row.id },
    orderBy: { observedAt: 'desc' },
    take: 20,
  });

  const recommendations = await prisma.recommendation.findMany({
    where: { fieldId: row.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const polygon = JSON.parse(row.polygon) as GeoJSON.Polygon;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <Link
          href="/dashboard/fields"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Wszystkie pola
        </Link>
      </div>

      <FieldDetailView
        field={{
          id: row.id,
          name: row.name,
          crop: row.crop,
          areaHectares: Number(row.area_hectares),
          polygon,
          centroid: {
            lat: Number(row.centroid_lat),
            lon: Number(row.centroid_lon),
          },
          createdAt: row.created_at.toISOString(),
        }}
        ndviHistory={ndviHistory.map((r) => ({
          id: r.id,
          observedAt: r.observedAt.toISOString(),
          mean: r.ndviMean,
          min: r.ndviMin,
          max: r.ndviMax,
          cloudCover: r.cloudCover,
          indices: {
            ndvi: { mean: r.ndviMean, min: r.ndviMin, max: r.ndviMax },
            ndre: r.ndreMean !== null && r.ndreMin !== null && r.ndreMax !== null
              ? { mean: r.ndreMean, min: r.ndreMin, max: r.ndreMax }
              : null,
            ndwi: r.ndwiMean !== null && r.ndwiMin !== null && r.ndwiMax !== null
              ? { mean: r.ndwiMean, min: r.ndwiMin, max: r.ndwiMax }
              : null,
            savi: r.saviMean !== null && r.saviMin !== null && r.saviMax !== null
              ? { mean: r.saviMean, min: r.saviMin, max: r.saviMax }
              : null,
          },
        }))}
        recommendations={recommendations.map((r) => ({
          id: r.id,
          severity: r.severity,
          title: r.title,
          message: r.message,
          action: r.action,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
