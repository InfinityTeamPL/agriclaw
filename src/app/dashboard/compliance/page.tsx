// Strona /dashboard/compliance — raport zgodności WPR 2023-2027 / IJHARS.
// Server component — renderuje stan zgodności + lista reguł.
// Szybki widok "gdzie jestem w zgodności z ARiMR" bez potrzeby ręcznego sprawdzania.

import Link from 'next/link';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { evaluateCompliance } from '@/lib/compliance';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Sprout, Layers } from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const { farm } = await requireFarm();

  // Pobierz pola + zabiegi w tym sezonie
  const fields = await prisma.field.findMany({
    where: { farmId: farm.id, deletedAt: null },
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

  // Kolor wskaźnika wg poziomu zgodności — sygnał danych (zdrowie/upał/susza)
  const scoreColor =
    report.score >= 80
      ? 'text-signal-healthy'
      : report.score >= 50
        ? 'text-signal-heat'
        : 'text-signal-drought';

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

  // Kolory identyfikujące gatunek uprawy w pasku struktury zasiewów — kolor DANYCH
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
        {/* Eyebrow jako odczyt HUD — nie badge ze Sparkles/ShieldCheck */}
        <div className="inline-flex items-center gap-2.5 border border-border bg-card px-3 py-1.5 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
          <span className="hud-label">Zgodność ARiMR / IJHARS · WPR 2023-2027</span>
        </div>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Raport zgodności gospodarstwa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Automatyczna kontrola reguł dywersyfikacji upraw, rotacji, rejestracji zabiegów. Dane z Twojej bazy pól i księgi polowej.
        </p>
      </div>

      {/* Big score card */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-card">
        <NdviKeyline className="absolute inset-x-0 top-0" height={3} rounded={false} />
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="hud-label">Ogólny poziom zgodności</div>
            <div className={`font-mono tabular text-6xl font-semibold mt-1 ${scoreColor}`}>
              {report.score}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {report.failCount > 0 && (
                <span className="text-signal-drought font-semibold">
                  {report.failCount} naruszenie{report.failCount > 1 ? 'nia' : ''}
                </span>
              )}
              {report.failCount > 0 && report.warnCount > 0 && (
                <span className="text-muted-foreground"> · </span>
              )}
              {report.warnCount > 0 && (
                <span className="text-signal-heat font-semibold">
                  {report.warnCount} ostrzeżenie{report.warnCount > 1 ? 'nia' : ''}
                </span>
              )}
              {report.failCount === 0 && report.warnCount === 0 && (
                <span className="text-signal-healthy font-semibold">Wszystko gra</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Sprout className="w-4 h-4 text-primary" />} label="Pola" value={String(report.fieldsCount)} />
            <StatCard icon={<Layers className="w-4 h-4 text-primary" />} label="Łączna powierzchnia" value={`${totalHectares.toFixed(1)} ha`} />
          </div>
        </div>
      </div>

      {/* Struktura zasiewów */}
      {cropDist.length > 0 && (
        <section className="rounded-lg bg-card border border-border p-5 space-y-4 shadow-card">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold tracking-tight text-foreground">Struktura zasiewów</h2>
          </div>
          {/* Stacked bar — kolory identyfikują gatunek uprawy (dane) */}
          <div className="flex rounded-md overflow-hidden h-8 border border-border">
            {cropDist.map((c) => (
              <div
                key={c.crop}
                title={`${cropLabels[c.crop] ?? c.crop} · ${c.ha.toFixed(1)} ha · ${c.pct.toFixed(0)}%`}
                className="flex items-center justify-center text-[10px] text-white font-mono tabular font-semibold"
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
                <span className="font-medium text-foreground">{cropLabels[c.crop] ?? c.crop}</span>
                <span className="text-muted-foreground font-mono tabular">
                  {c.ha.toFixed(1)} ha · {c.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reguły */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold tracking-tight text-foreground">Sprawdzone reguły</h2>
        {report.rules.length === 0 && (
          <div className="rounded-md bg-secondary border border-border p-4 text-sm text-muted-foreground">
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
          // Kolory statusu reguły — sygnały danych (zdrowie/susza/upał/przymrozek)
          const statusClass =
            rule.status === 'pass'
              ? 'bg-signal-healthy/10 border-signal-healthy/30'
              : rule.status === 'fail'
                ? 'bg-signal-drought/10 border-signal-drought/30'
                : rule.status === 'warn'
                  ? 'bg-signal-heat/10 border-signal-heat/30'
                  : 'bg-signal-frost/10 border-signal-frost/30';
          const iconColor =
            rule.status === 'pass'
              ? 'text-signal-healthy'
              : rule.status === 'fail'
                ? 'text-signal-drought'
                : rule.status === 'warn'
                  ? 'text-signal-heat'
                  : 'text-signal-frost';
          const label: Record<typeof rule.status, string> = {
            pass: 'OK',
            fail: 'Naruszenie',
            warn: 'Ostrzeżenie',
            info: 'Info',
          };
          return (
            <div key={rule.id} className={`rounded-lg border p-4 text-foreground ${statusClass}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{rule.title}</span>
                    <span className={`hud-label px-2 py-0.5 rounded-full bg-card ${iconColor}`}>
                      {label[rule.status]}
                    </span>
                  </div>
                  <p className="text-sm mt-1 leading-relaxed text-muted-foreground">{rule.detail}</p>
                  {rule.action && (
                    <div className="mt-2 rounded-md bg-card border border-border p-2.5 text-sm">
                      <span className="font-semibold">Co zrobić: </span>
                      {rule.action}
                    </div>
                  )}
                  <div className="mt-2 hud-label">
                    Podstawa: {rule.legalBasis}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="rounded-lg bg-card border border-border p-5 shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-display font-semibold tracking-tight text-foreground">Eksport do kontroli IJHARS/ARiMR</div>
            <div className="text-sm text-muted-foreground mt-1">
              Księga polowa jako PDF z danymi kontrolnymi (format IJHARS) — do okazania inspektorowi.
            </div>
          </div>
          <Link
            href="/api/treatments/export/pdf"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow-card hover:brightness-110 transition-all"
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
    <div className="rounded-md bg-secondary border border-border p-3">
      <div className="flex items-center gap-1.5 hud-label">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono tabular text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
