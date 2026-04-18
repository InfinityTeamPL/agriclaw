'use client';

// Połączenie ParcelImport + szybki formularz "nazwij pole + wybierz uprawę + zapisz"
// Skrót dla rolników którzy mają numery TERYT z wniosku JPO.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, Loader2, Check, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { ParcelImport } from './ParcelImport';
import { CROPS } from '@/lib/ui/format';

interface ImportedParcel {
  teryt: string;
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaHectares: number;
  centroid: { lat: number; lon: number };
}

export function ParcelImportSave({ farmId }: { farmId: string }) {
  const router = useRouter();
  const [parcel, setParcel] = useState<ImportedParcel | null>(null);
  const [name, setName] = useState('');
  const [crop, setCrop] = useState<(typeof CROPS)[number]['value']>('wheat');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!parcel || !name.trim()) {
      toast.error('Wpisz nazwę pola');
      return;
    }
    setSaving(true);
    try {
      // Jeśli MultiPolygon, bierzemy pierwszy polygon
      const polygon: GeoJSON.Polygon =
        parcel.polygon.type === 'Polygon'
          ? (parcel.polygon as GeoJSON.Polygon)
          : {
              type: 'Polygon',
              coordinates: (parcel.polygon as GeoJSON.MultiPolygon).coordinates[0],
            };

      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          name: name.trim(),
          crop,
          polygon,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(typeof err?.error === 'string' ? err.error : 'Nie udało się zapisać');
        setSaving(false);
        return;
      }
      const created = (await res.json()) as { id: string };
      toast.success('Pole zapisane z ARiMR.');
      router.push(`/dashboard/fields/${created.id}`);
      router.refresh();
    } catch (err) {
      toast.error(String(err));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <ParcelImport onImported={(p) => setParcel(p as ImportedParcel)} />

      {parcel && (
        <div className="rounded-2xl bg-white border border-gray-200 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <ArrowDown className="w-4 h-4" />
            Dopełnij dane i zapisz
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nazwa pola
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Pole za stodołą"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Uprawa
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value as (typeof CROPS)[number]['value'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CROPS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Zapisuję...' : `Zapisz pole (${parcel.areaHectares.toFixed(2)} ha)`}
          </button>
        </div>
      )}
    </div>
  );
}
