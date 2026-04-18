'use client';

// Lista pól z filtrem po uprawie (client side).

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cropLabel, formatDatePL, formatHa, CROPS } from '@/lib/ui/format';
import { classifyNdvi, ndviColorHex } from '@/lib/satellite/ndvi';

export interface FieldListItem {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
  createdAt: string;
  ndviMean: number | null;
  ndviObservedAt: string | null;
}

export function FieldsList({ items }: { items: FieldListItem[] }) {
  const [filter, setFilter] = useState<string>('all');

  const availableCrops = useMemo(() => {
    const used = new Set(items.map((i) => i.crop));
    return CROPS.filter((c) => used.has(c.value));
  }, [items]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.crop === filter)),
    [filter, items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="crop-filter" className="text-sm text-gray-600">
          Filtruj wg uprawy:
        </label>
        <select
          id="crop-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="all">Wszystkie ({items.length})</option>
          {availableCrops.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 font-medium">
          <div className="col-span-4">Pole</div>
          <div className="col-span-2">Uprawa</div>
          <div className="col-span-2">Powierzchnia</div>
          <div className="col-span-3">Ostatnia analiza</div>
          <div className="col-span-1 text-right">NDVI</div>
        </div>
        <ul>
          {filtered.map((f) => (
            <li
              key={f.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
            >
              <Link
                href={`/dashboard/fields/${f.id}`}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center"
              >
                <div className="col-span-12 md:col-span-4">
                  <div className="font-medium text-gray-900">{f.name}</div>
                  <div className="text-xs text-gray-500 md:hidden mt-0.5">
                    {cropLabel(f.crop)} · {formatHa(f.areaHectares)} ha
                  </div>
                </div>
                <div className="hidden md:block md:col-span-2 text-sm text-gray-700">
                  {cropLabel(f.crop)}
                </div>
                <div className="hidden md:block md:col-span-2 text-sm text-gray-700">
                  {formatHa(f.areaHectares)} ha
                </div>
                <div className="hidden md:block md:col-span-3 text-sm text-gray-500">
                  {f.ndviObservedAt
                    ? formatDatePL(f.ndviObservedAt)
                    : 'Nie uruchomiono'}
                </div>
                <div className="col-span-12 md:col-span-1 md:text-right">
                  <NdviCell mean={f.ndviMean} />
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-6 text-sm text-gray-500 text-center">
              Brak pól dla wybranej uprawy.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function NdviCell({ mean }: { mean: number | null }) {
  if (mean === null) {
    return (
      <span className="text-xs text-gray-400 inline-block">—</span>
    );
  }
  const color = ndviColorHex(mean);
  const cls = classifyNdvi(mean);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{
        color: '#0f172a',
        backgroundColor: `${color}22`,
        borderColor: `${color}66`,
      }}
      title={`Klasa: ${cls}`}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {mean.toFixed(2)}
    </span>
  );
}
