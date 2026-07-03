import { ScanLine } from '@/components/brand/ScanLine';

// Widok pola — mapa (lewa) + panel danych (prawa), oba jako scan-line skeleton.
export default function FieldLoading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ScanLine className="h-[420px]" label="Ładowanie mapy NDVI…" />
        <div className="space-y-4">
          <ScanLine className="h-40" />
          <ScanLine className="h-56" />
        </div>
      </div>
    </div>
  );
}
