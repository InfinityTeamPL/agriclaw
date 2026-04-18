// Strona startowa dashboard — podsumowanie gospodarstwa.
// Liczba pól + łączna powierzchnia + ostatnie rekomendacje + karty pól z NDVI.

import Link from 'next/link';
import { Plus, Sprout, LineChart, AlertTriangle } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { classifyNdvi, ndviColorHex } from '@/lib/satellite/ndvi';
import { cropLabel, formatHa, formatDatePL, severityStyle } from '@/lib/ui/format';

export const dynamic = 'force-dynamic';

interface FieldRow {
  id: string;
  name: string;
  crop: string;
  area_hectares: number;
  created_at: Date;
}

export default async function DashboardHome() {
  const { farm } = await requireFarm();

  const fields = await prisma.$queryRaw<FieldRow[]>`
    SELECT id, name, crop, area_hectares, created_at
    FROM "fields"
    WHERE farm_id = ${farm.id}
    ORDER BY created_at DESC
  `;
  const fieldIds = fields.map((f) => f.id);

  // Ostatni NDVI dla każdego pola
  const readings = fieldIds.length
    ? await prisma.ndviReading.findMany({
        where: { fieldId: { in: fieldIds } },
        orderBy: { observedAt: 'desc' },
      })
    : [];
  const latestNdviByField = new Map<
    string,
    { mean: number; observedAt: Date }
  >();
  for (const r of readings) {
    if (!latestNdviByField.has(r.fieldId)) {
      latestNdviByField.set(r.fieldId, { mean: r.ndviMean, observedAt: r.observedAt });
    }
  }

  // Ostatnie 5 rekomendacji dla tego gospodarstwa
  const recentRecs = fieldIds.length
    ? await prisma.recommendation.findMany({
        where: { fieldId: { in: fieldIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          field: { select: { id: true, name: true } },
        },
      })
    : [];

  const totalHa = fields.reduce((acc, f) => acc + Number(f.area_hectares), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel gospodarstwa</h1>
          <p className="text-sm text-gray-500">
            Co się dzieje na {fields.length === 1 ? 'Twoim polu' : 'Twoich polach'} dzisiaj.
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

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={<Sprout className="w-4 h-4 text-emerald-600" />} label="Pola" value={String(fields.length)} />
        <Stat icon={<LineChart className="w-4 h-4 text-emerald-600" />} label="Łączna powierzchnia" value={`${formatHa(totalHa)} ha`} />
        <Stat
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          label="Aktualne rekomendacje"
          value={String(recentRecs.filter((r) => r.severity !== 'none').length)}
        />
      </div>

      {/* Pola */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Twoje pola</h2>
          {fields.length > 0 && (
            <Link
              href="/dashboard/fields"
              className="text-sm text-emerald-700 hover:underline"
            >
              Zobacz wszystkie
            </Link>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Sprout className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Nie masz jeszcze pól</p>
            <p className="text-sm text-gray-500 mt-1">
              Dodaj pierwsze pole narysowaniem granicy na mapie.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((f) => {
              const ndvi = latestNdviByField.get(f.id);
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/fields/${f.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-sm transition block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{f.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cropLabel(f.crop)} · {formatHa(Number(f.area_hectares))} ha
                      </p>
                    </div>
                    <NdviBadge mean={ndvi?.mean} />
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    {ndvi
                      ? `Ostatnia analiza: ${formatDatePL(ndvi.observedAt)}`
                      : 'Brak analizy. Uruchom analizę po otwarciu pola.'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Rekomendacje */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Ostatnie rekomendacje</h2>
        {recentRecs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
            Brak rekomendacji. Uruchom analizę pola, aby wygenerować pierwszą.
          </div>
        ) : (
          <ul className="space-y-2">
            {recentRecs.map((r) => {
              const style = severityStyle(r.severity);
              return (
                <li
                  key={r.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <span
                    className={`shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${style.pill}`}
                  >
                    {style.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <Link
                        href={`/dashboard/fields/${r.fieldId}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {r.title}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {formatDatePL(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pole: <span className="text-gray-700">{r.field.name}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-2">{value}</div>
    </div>
  );
}

function NdviBadge({ mean }: { mean: number | undefined }) {
  if (typeof mean !== 'number') {
    return (
      <span className="shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
        Brak NDVI
      </span>
    );
  }
  const color = ndviColorHex(mean);
  const cls = classifyNdvi(mean);
  const label: Record<typeof cls, string> = {
    bare: 'goła ziemia',
    stressed: 'stres',
    moderate: 'średnio',
    healthy: 'zdrowe',
    'very-healthy': 'bujne',
  };
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{
        color: '#0f172a',
        backgroundColor: `${color}22`,
        borderColor: `${color}66`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      NDVI {mean.toFixed(2)} · {label[cls]}
    </span>
  );
}
