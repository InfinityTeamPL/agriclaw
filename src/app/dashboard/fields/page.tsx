// Lista wszystkich pól w gospodarstwie.
// Server component wczytuje pola + ostatni NDVI i pierwszy kolor status.
// Filter by uprawa jest client-side (FieldsList).

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
}

export default async function FieldsPage() {
  const { farm } = await requireFarm();

  const rows = await prisma.$queryRaw<FieldRow[]>`
    SELECT id, name, crop, area_hectares, created_at
    FROM "fields"
    WHERE farm_id = ${farm.id}
    ORDER BY created_at DESC
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
      ndviMean: ndvi?.mean ?? null,
      ndviObservedAt: ndvi?.observedAt.toISOString() ?? null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moje pola</h1>
          <p className="text-sm text-gray-500">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'pole' : 'pól'} w gospodarstwie.`
              : 'Jeszcze nie dodałeś żadnego pola.'}
          </p>
        </div>
        <Link
          href="/dashboard/fields/new"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          Dodaj pole
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Sprout className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-gray-700 font-medium">Brak pól</p>
          <p className="text-sm text-gray-500 mt-1">
            Dodaj pierwsze pole narysowaniem granicy na mapie satelitarnej.
          </p>
          <Link
            href="/dashboard/fields/new"
            className="inline-flex items-center gap-2 mt-4 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
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
