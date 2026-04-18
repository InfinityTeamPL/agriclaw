// Dodawanie nowego pola — dwa warianty UX:
//  A) Wklej numer TERYT z wniosku ARiMR → polygon pobrany z GUGiK (1 sek)
//  B) Narysuj granicę ręcznie na mapie

import Link from 'next/link';
import { ArrowLeft, Zap, PencilLine } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { FieldMapEditor } from '@/components/field-editor/FieldMapEditor';
import { ParcelImportSave } from '@/components/field-editor/ParcelImportSave';

export const dynamic = 'force-dynamic';

export default async function NewFieldPage() {
  const { farm } = await requireFarm();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
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
        <p className="text-sm text-gray-500">Dwie drogi — wybierz łatwiejszą dla Ciebie.</p>
      </div>

      {/* Opcja A: Import z ARiMR (preferowana) */}
      <section className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              A. Import z ARiMR / Geoportal (1 sekunda)
            </div>
            <div className="text-xs text-gray-500">
              Jeśli masz numer działki z wniosku JPO — pobierz granicę 1:1 z ewidencji gruntów.
            </div>
          </div>
        </div>
        <ParcelImportSave farmId={farm.id} />
      </section>

      {/* Opcja B: Rysuj ręcznie */}
      <section className="rounded-3xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <PencilLine className="w-4 h-4 text-gray-700" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">B. Narysuj granicę na mapie</div>
            <div className="text-xs text-gray-500">
              Klikaj punkty na mapie, min. 3 wierzchołki. Dla nieregularnych pól albo jeśli nie masz numeru TERYT.
            </div>
          </div>
        </div>
        <FieldMapEditor farmId={farm.id} center={{ lat: farm.lat, lon: farm.lon }} />
      </section>
    </div>
  );
}
