// Lista wszystkich pól w gospodarstwie.
// Server component wczytuje pola z poligonami (PostGIS), ostatnie NDVI.
// Grid/list toggle + sort + filter po stronie klienta (FieldsList).

import Link from 'next/link';
import { Plus, Sprout } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { FieldsList, type FieldListItem } from './FieldsList';

export const dynamic = 'force-dynamic';

interface FieldRow {
  id: string;
  name: string;
  crop: string;
  area_hectares: number;
  created_at: Date;
  polygon: string;
}

export default async function FieldsPage() {
  const { farm } = await requireFarm();

  const rows = await prisma.$queryRaw<FieldRow[]>`
    SELECT f.id, f.name, f.crop, f.area_hectares, f.created_at,
           ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    WHERE f.farm_id = ${farm.id}
    ORDER BY f.created_at DESC
  `;

  const fieldIds = rows.map((r) => r.id);
  const readings = fieldIds.length
    ? await prisma.ndviReading.findMany({
        where: { fieldId: { in: fieldIds } },
        orderBy: { observedAt: 'desc' },
      })
    : [];

  const latest = new Map<string, { mean: number; observedAt: Date }>();
  for (const r of readings) {
    if (!latest.has(r.fieldId)) {
      latest.set(r.fieldId, { mean: r.ndviMean, observedAt: r.observedAt });
    }
  }

  const items: FieldListItem[] = rows.map((r) => {
    const ndvi = latest.get(r.id);
    return {
      id: r.id,
      name: r.name,
      crop: r.crop,
      areaHectares: Number(r.area_hectares),
      createdAt: r.created_at.toISOString(),
      polygon: JSON.parse(r.polygon) as GeoJSON.Polygon,
      ndviMean: ndvi?.mean ?? null,
      ndviObservedAt: ndvi?.observedAt.toISOString() ?? null,
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-medium">
            <Sprout className="w-3.5 h-3.5" />
            Katalog gospodarstwa
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            Moje pola
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'pole' : 'pól'} w gospodarstwie · ${items
                  .reduce((acc, f) => acc + f.areaHectares, 0)
                  .toFixed(2)} ha łącznie.`
              : 'Jeszcze nie dodałeś żadnego pola.'}
          </p>
        </div>
        <Link
          href="/dashboard/fields/new"
          className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium px-5 py-2.5 rounded-2xl shadow-[0_10px_25px_-10px_rgba(16,185,129,0.7)] hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.9)] hover:-translate-y-0.5 transition"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Dodaj pole
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-dashed border-emerald-300/60 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center mb-3">
            <Sprout className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-gray-900 font-medium">Brak pól</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            Dodaj pierwsze pole — narysuj granicę na mapie satelitarnej i gotowe.
          </p>
          <Link
            href="/dashboard/fields/new"
            className="inline-flex items-center gap-2 mt-5 bg-emerald-600 text-white font-medium px-4 py-2 rounded-2xl hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj pierwsze pole
          </Link>
        </div>
      ) : (
        <FieldsList items={items} />
      )}
    </div>
  );
}
