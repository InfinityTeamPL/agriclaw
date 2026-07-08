// Dodawanie nowego pola — dwa warianty UX:
//  A) Wklej numer TERYT z wniosku ARiMR → polygon pobrany z GUGiK (1 sek)
//  B) Narysuj granicę ręcznie na mapie

import Link from 'next/link';
import { ArrowLeft, Zap, PencilLine } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróć do listy pól
        </Link>
      </div>
      {/* Karta nagłówkowa z sygnaturą NDVI — jak w /dashboard/fields */}
      <div className="relative rounded-lg bg-card border border-border p-5 shadow-card overflow-hidden">
        <NdviKeyline className="absolute top-0 left-0" rounded={false} height={3} />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Dodaj pole</h1>
        <p className="text-sm text-muted-foreground">Dwie drogi — wybierz łatwiejszą dla Ciebie.</p>
      </div>

      {/* Opcja A: Import z ARiMR (preferowana) */}
      <section className="relative rounded-lg border border-border bg-card p-5 space-y-3 shadow-card overflow-hidden">
        <NdviKeyline className="absolute top-0 left-0" rounded={false} height={2} />
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              A. Import z ARiMR / Geoportal (1 sekunda)
            </div>
            <div className="text-xs text-muted-foreground">
              Jeśli masz numer działki z wniosku JPO — pobierz granicę 1:1 z ewidencji gruntów.
            </div>
          </div>
        </div>
        <ParcelImportSave farmId={farm.id} />
      </section>

      {/* Opcja B: Rysuj ręcznie */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
            <PencilLine className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <div className="font-semibold text-foreground">B. Narysuj granicę na mapie</div>
            <div className="text-xs text-muted-foreground">
              Klikaj punkty na mapie, min. 3 wierzchołki. Dla nieregularnych pól albo jeśli nie masz numeru TERYT.
            </div>
          </div>
        </div>
        <FieldMapEditor farmId={farm.id} center={{ lat: farm.lat, lon: farm.lon }} />
      </section>
    </div>
  );
}
