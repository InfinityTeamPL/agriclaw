'use client';

// Połączenie ParcelImport + szybki formularz "nazwij pole + wybierz uprawę + zapisz"
// Skrót dla rolników którzy mają numery TERYT z wniosku JPO.

import { useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { ParcelImport, type ParcelResult } from './ParcelImport';
import { CROPS, formatHa } from '@/lib/ui/format';
import { fetchJson } from '@/lib/ui/api-error';
import { largestPart, polygonAreaM2 } from '@/lib/satellite/gugik-uldk';

export function ParcelImportSave({ farmId }: { farmId: string }) {
  const router = useRouter();
  const nameId = useId();
  const cropId = useId();
  const [parcel, setParcel] = useState<ParcelResult | null>(null);
  const [name, setName] = useState('');
  const [crop, setCrop] = useState<(typeof CROPS)[number]['value']>('wheat');
  const [saving, setSaving] = useState(false);

  // Zapisujemy jeden poligon. Dla działki z kilku części — największą — i pokazujemy
  // jej faktyczną powierzchnię, a nie sumę wszystkich części.
  const { polygon, savedHa } = useMemo(() => {
    if (!parcel) return { polygon: null, savedHa: 0 };
    const poly = parcel.polygon.type === 'Polygon' ? parcel.polygon : largestPart(parcel.polygon);
    return { polygon: poly, savedHa: polygonAreaM2(poly) / 10_000 };
  }, [parcel]);

  const save = async () => {
    if (!parcel || !polygon || !name.trim()) {
      toast.error('Wpisz nazwę pola.');
      return;
    }
    setSaving(true);
    const res = await fetchJson<{ id: string }>(
      '/api/fields',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, name: name.trim(), crop, polygon }),
      },
      'Nie udało się zapisać pola. Spróbuj ponownie.',
    );
    if (!res.ok) {
      toast.error(res.message);
      setSaving(false);
      return;
    }
    toast.success('Pole zapisane z ARiMR.');
    router.push(`/dashboard/fields/${res.data.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <ParcelImport onImported={setParcel} />

      {parcel && (
        <div className="rounded-lg bg-card border border-border shadow-card p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ArrowDown className="w-4 h-4" />
            Dopełnij dane i zapisz
          </div>

          <div>
            <label htmlFor={nameId} className="block text-xs font-semibold text-foreground mb-1">
              Nazwa pola
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Pole za stodołą"
              className="w-full min-h-11 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor={cropId} className="block text-xs font-semibold text-foreground mb-1">
              Uprawa
            </label>
            <select
              id={cropId}
              value={crop}
              onChange={(e) => setCrop(e.target.value as (typeof CROPS)[number]['value'])}
              className="w-full min-h-11 px-3 py-2 border border-input rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CROPS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Zapisuję...' : `Zapisz pole (${formatHa(savedHa)} ha)`}
          </button>
          {!name.trim() && (
            <p className="text-xs text-muted-foreground text-center">Wpisz nazwę pola, żeby je zapisać.</p>
          )}
        </div>
      )}
    </div>
  );
}
