// Dodawanie nowego pola — formularz + MapLibre editor.
// Server component wczytuje farmę (dla centrum mapy) i przekazuje do klienta.

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { FieldMapEditor } from '@/components/field-editor/FieldMapEditor';

export const dynamic = 'force-dynamic';

export default async function NewFieldPage() {
  const { farm } = await requireFarm();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <Link
          href="/dashboard/fields"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróć do listy pól
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dodaj pole</h1>
        <p className="text-sm text-gray-500">
          Podaj nazwę i uprawę, a potem narysuj granicę pola klikając na mapie.
        </p>
      </div>
      <FieldMapEditor
        farmId={farm.id}
        center={{ lat: farm.lat, lon: farm.lon }}
      />
    </div>
  );
}
