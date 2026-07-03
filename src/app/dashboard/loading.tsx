import { ScanLine } from '@/components/brand/ScanLine';

// Stan ładowania panelu — szkielet w geometrii docelowych kart, z sygnaturową
// linią skanu (zamiast białej klatki / spinnera).
export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <ScanLine className="h-28" label="Skan pola…" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ScanLine className="h-32" />
        <ScanLine className="h-32" />
        <ScanLine className="h-32" />
      </div>
      <ScanLine className="h-64" />
    </div>
  );
}
