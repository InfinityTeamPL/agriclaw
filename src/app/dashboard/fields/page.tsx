// Lista wszystkich pól w gospodarstwie.
// Server component wczytuje pola z poligonami (PostGIS), ostatnie NDVI.
// Grid/list toggle + sort + filter po stronie klienta (FieldsList).

import Link from 'next/link';
import { Plus, Sprout } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
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
    WHERE f.farm_id = ${farm.id} AND f.deleted_at IS NULL
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

  const totalHa = items.reduce((acc, f) => acc + f.areaHectares, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
            <span className="hud-label">Katalog gospodarstwa</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
            Moje pola
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length > 0 ? (
              <>
                <span className="font-mono tabular text-foreground">{items.length}</span>{' '}
                {items.length === 1 ? 'pole' : 'pól'} w gospodarstwie ·{' '}
                <span className="font-mono tabular text-foreground">{totalHa.toFixed(2)}</span> ha
                łącznie.
              </>
            ) : (
              'Jeszcze nie dodałeś żadnego pola.'
            )}
          </p>
        </div>
        <Link
          href="/dashboard/fields/new"
          className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-md shadow-card hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Dodaj pole
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="relative rounded-lg bg-card border border-dashed border-border p-10 text-center shadow-card overflow-hidden">
          <NdviKeyline className="absolute top-0 left-0" />
          <div className="w-12 h-12 rounded-md bg-secondary border border-border mx-auto flex items-center justify-center mb-3">
            <Sprout className="w-5 h-5 text-signal-healthy" />
          </div>
          <p className="text-foreground font-medium">Brak pól</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Dodaj pierwsze pole — narysuj granicę na mapie satelitarnej i gotowe.
          </p>
          <Link
            href="/dashboard/fields/new"
            className="inline-flex items-center gap-2 mt-5 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:brightness-110 transition-all"
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
