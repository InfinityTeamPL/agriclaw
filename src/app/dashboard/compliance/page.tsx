// Strona /dashboard/compliance — raport zgodności WPR 2023-2027 / IJHARS.
// Server component — renderuje stan zgodności + lista reguł.
// Szybki widok "gdzie jestem w zgodności z ARiMR" bez potrzeby ręcznego sprawdzania.

import Link from 'next/link';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { evaluateCompliance } from '@/lib/compliance';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, CheckCircle2, Sprout, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const { farm } = await requireFarm();

  // Pobierz pola + zabiegi w tym sezonie
  const fields = await prisma.field.findMany({
    where: { farmId: farm.id },
    select: {
      id: true,
      name: true,
      crop: true,
      areaHectares: true,
      treatments: {
        where: {
          performedAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        select: { performedAt: true, type: true, productName: true },
        orderBy: { performedAt: 'desc' },
      },
    },
  });

  // Historia uprav z Treatment.type='sowing' ostatnie 4 lata
  const cutoff = new Date(new Date().getFullYear() - 4, 0, 1);
  const sowings = await prisma.treatment.findMany({
    where: {
      field: { farmId: farm.id },
      type: 'sowing',
      performedAt: { gte: cutoff },
    },
    select: { fieldId: true, performedAt: true, productName: true },
    orderBy: { performedAt: 'asc' },
  });

  const previousByField = new Map<string, string[]>();
  for (const s of sowings) {
    const lower = s.productName.toLowerCase();
    let crop = 'other';
    if (/pszen/.test(lower)) crop = 'wheat';
    else if (/rzepak/.test(lower)) crop = 'rapeseed';
    else if (/kukurydz/.test(lower)) crop = 'corn';
    else if (/jęczm|jeczm/.test(lower)) crop = 'barley';
    else if (/żyt|zyt/.test(lower)) crop = 'rye';
    else if (/owies|owi/.test(lower)) crop = 'oats';
    else if (/ziemniak/.test(lower)) crop = 'potato';
    else if (/burak/.test(lower)) crop = 'sugarbeet';
    const arr = previousByField.get(s.fieldId) ?? [];
    arr.push(crop);
    previousByField.set(s.fieldId, arr);
  }

  const totalHectares = fields.reduce((s, f) => s + f.areaHectares, 0);
  const report = evaluateCompliance({
    totalHectares,
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: f.areaHectares,
      previousCrops: previousByField.get(f.id),
      treatmentsCountThisSeason: f.treatments.length,
      lastTreatmentAt: f.treatments[0]?.performedAt ?? null,
    })),
  });

  const cropAreas = new Map<string, number>();
  for (const f of fields) {
    cropAreas.set(f.crop, (cropAreas.get(f.crop) ?? 0) + f.areaHectares);
  }
  const cropDist = Array.from(cropAreas.entries())
    .map(([crop, ha]) => ({ crop, ha, pct: totalHectares > 0 ? (ha / totalHectares) * 100 : 0 }))
    .sort((a, b) => b.ha - a.ha);

  const scoreColor =
    report.score >= 80 ? 'text-emerald-700' : report.score >= 50 ? 'text-amber-700' : 'text-red-700';
  const scoreBg =
    report.score >= 80 ? 'from-emerald-50' : report.score >= 50 ? 'from-amber-50' : 'from-red-50';

  const cropLabels: Record<string, string> = {
    wheat: 'Pszenica',
    barley: 'Jęczmień',
    rye: 'Żyto',
    oats: 'Owies',
    rapeseed: 'Rzepak',
    corn: 'Kukurydza',
    potato: 'Ziemniak',
    sugarbeet: 'Burak cukrowy',
    other: 'Inna',
  };

  const cropColors: Record<string, string> = {
    wheat: '#84cc16',
    barley: '#facc15',
    rye: '#f97316',
    oats: '#a16207',
    rapeseed: '#fbbf24',
    corn: '#ca8a04',
    potato: '#65a30d',
    sugarbeet: '#14532d',
    other: '#6b7280',
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zgodność ARiMR / IJHARS · WPR 2023-2027
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
          Raport zgodności gospodarstwa
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Automatyczna kontrola reguł dywersyfikacji upraw, rotacji, rejestracji zabiegów. Dane z Twojej bazy pól i księgi polowej.
        </p>
      </div>

      {/* Big score card */}
      <div className={`rounded-3xl border border-white/60 bg-gradient-to-br ${scoreBg} to-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.2)]`}>
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
              Ogólny poziom zgodności
            </div>
            <div className={`text-6xl font-bold tabular-nums mt-1 ${scoreColor}`}>
              {report.score}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {report.failCount > 0 && (
                <span className="text-red-700 font-semibold">
                  {report.failCount} naruszenie{report.failCount > 1 ? 'nia' : ''}
                </span>
              )}
              {report.failCount > 0 && report.warnCount > 0 && <span className="text-gray-400"> · </span>}
              {report.warnCount > 0 && (
                <span className="text-amber-700 font-semibold">
                  {report.warnCount} ostrzeżenie{report.warnCount > 1 ? 'nia' : ''}
                </span>
              )}
              {report.failCount === 0 && report.warnCount === 0 && (
                <span className="text-emerald-700 font-semibold">Wszystko gra</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Sprout className="w-4 h-4 text-emerald-600" />} label="Pola" value={String(report.fieldsCount)} />
            <StatCard icon={<Layers className="w-4 h-4 text-emerald-600" />} label="Łączna powierzchnia" value={`${totalHectares.toFixed(1)} ha`} />
          </div>
        </div>
      </div>

      {/* Struktura zasiewów */}
      {cropDist.length > 0 && (
        <section className="rounded-3xl bg-white border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-700" />
            <h2 className="font-semibold text-gray-900">Struktura zasiewów</h2>
          </div>
          {/* Stacked bar */}
          <div className="flex rounded-xl overflow-hidden h-8 border border-gray-200">
            {cropDist.map((c) => (
              <div
                key={c.crop}
                title={`${cropLabels[c.crop] ?? c.crop} · ${c.ha.toFixed(1)} ha · ${c.pct.toFixed(0)}%`}
                className="flex items-center justify-center text-[10px] text-white font-semibold"
                style={{
                  width: `${c.pct}%`,
                  backgroundColor: cropColors[c.crop] ?? '#6b7280',
                }}
              >
                {c.pct >= 8 && `${c.pct.toFixed(0)}%`}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {cropDist.map((c) => (
              <div key={c.crop} className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cropColors[c.crop] ?? '#6b7280' }} />
                <span className="font-medium text-gray-700">{cropLabels[c.crop] ?? c.crop}</span>
                <span className="text-gray-400 tabular-nums">
                  {c.ha.toFixed(1)} ha · {c.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reguły */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">Sprawdzone reguły</h2>
        {report.rules.length === 0 && (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
            Brak danych do analizy — dodaj pola i zabiegi w Księdze polowej.
          </div>
        )}
        {report.rules.map((rule) => {
          const Icon =
            rule.status === 'pass'
              ? CheckCircle2
              : rule.status === 'fail'
                ? AlertCircle
                : rule.status === 'warn'
                  ? AlertTriangle
                  : Info;
          const statusClass =
            rule.status === 'pass'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : rule.status === 'fail'
                ? 'bg-red-50 border-red-200 text-red-900'
                : rule.status === 'warn'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-sky-50 border-sky-200 text-sky-900';
          const iconColor =
            rule.status === 'pass'
              ? 'text-emerald-600'
              : rule.status === 'fail'
                ? 'text-red-600'
                : rule.status === 'warn'
                  ? 'text-amber-600'
                  : 'text-sky-600';
          const label: Record<typeof rule.status, string> = {
            pass: 'OK',
            fail: 'Naruszenie',
            warn: 'Ostrzeżenie',
            info: 'Info',
          };
          return (
            <div key={rule.id} className={`rounded-2xl border p-4 ${statusClass}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{rule.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/60 ${iconColor}`}>
                      {label[rule.status]}
                    </span>
                  </div>
                  <p className="text-sm mt-1 leading-relaxed opacity-90">{rule.detail}</p>
                  {rule.action && (
                    <div className="mt-2 rounded-xl bg-white/60 border border-current/20 p-2.5 text-sm">
                      <span className="font-semibold">Co zrobić: </span>
                      {rule.action}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] uppercase tracking-wider opacity-60 font-mono">
                    Podstawa: {rule.legalBasis}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-semibold text-gray-900">Eksport do kontroli IJHARS/ARiMR</div>
            <div className="text-sm text-gray-600 mt-1">
              Księga polowa jako PDF z danymi kontrolnymi (format IJHARS) — do okazania inspektorowi.
            </div>
          </div>
          <Link
            href="/api/treatments/export/pdf"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Pobierz PDF
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/70 border border-white/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}
