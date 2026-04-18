'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Download,
  Filter,
  Calendar,
  MapPin,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TREATMENT_TYPES,
  TREATMENT_PURPOSES,
  findProduct,
  getTreatmentTypeLabel,
  getTreatmentTypeIcon,
  type CommonProduct,
} from '@/lib/treatment-types';
import { cropLabel, formatDatePL } from '@/lib/ui/format';

interface FieldOpt {
  id: string;
  name: string;
  crop: string;
  areaHectares: number;
}

interface Treatment {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldCrop: string;
  performedAt: string;
  type: string;
  purpose: string | null;
  productName: string;
  activeSubstance: string | null;
  doseValue: number | null;
  doseUnit: string | null;
  areaTreated: number;
  operatorName: string | null;
  weatherTemp: number | null;
  weatherWind: number | null;
  preHarvestIntervalDays: number | null;
  notes: string | null;
}

interface Props {
  farmId: string;
  fields: FieldOpt[];
  treatments: Treatment[];
}

export function JournalClient({ fields, treatments: initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterField, setFilterField] = useState<string>('all');

  const filtered = useMemo(() => {
    return initial.filter(
      (t) =>
        (filterType === 'all' || t.type === filterType) &&
        (filterField === 'all' || t.fieldId === filterField),
    );
  }, [initial, filterType, filterField]);

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const yearTreatments = initial.filter(
      (t) => new Date(t.performedAt).getFullYear() === thisYear,
    );
    const sprays = yearTreatments.filter((t) => t.type === 'spray').length;
    const fertilizers = yearTreatments.filter((t) => t.type === 'fertilizer').length;
    const others =
      yearTreatments.length - sprays - fertilizers;
    const pendingKarencja = initial.filter(
      (t) =>
        t.preHarvestIntervalDays &&
        new Date(t.performedAt).getTime() +
          t.preHarvestIntervalDays * 864e5 >
          Date.now(),
    ).length;
    return {
      total: initial.length,
      year: yearTreatments.length,
      sprays,
      fertilizers,
      others,
      pendingKarencja,
    };
  }, [initial]);

  const exportCsv = () => {
    window.open('/api/treatments/export?format=csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-700" />
            Księga polowa
          </h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Elektroniczny rejestr zabiegów agrotechnicznych — obowiązek dla gospodarstw
            powyżej 10 ha (Dz.U. 2022 poz. 2453). Eksport CSV zgodny z wymogami kontroli.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Eksport CSV
          </button>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Dodaj zabieg
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Wszystkich zapisów" value={stats.total.toString()} />
        <StatCard label={`W ${new Date().getFullYear()} r.`} value={stats.year.toString()} />
        <StatCard label="Opryski" value={stats.sprays.toString()} accent="text-sky-700" />
        <StatCard label="Nawożenia" value={stats.fertilizers.toString()} accent="text-emerald-700" />
        <StatCard
          label="Aktywna karencja"
          value={stats.pendingKarencja.toString()}
          accent={stats.pendingKarencja > 0 ? 'text-amber-700' : 'text-gray-400'}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">Wszystkie typy</option>
          {TREATMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
        <select
          value={filterField}
          onChange={(e) => setFilterField(e.target.value)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">Wszystkie pola</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} / {initial.length} zapisów
        </span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TreatmentRow key={t.id} t={t} />
          ))}
        </div>
      )}

      {open && (
        <AddTreatmentModal
          fields={fields}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
            toast.success('Zabieg zapisany.');
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'text-gray-900',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="font-semibold text-gray-900 mb-1">Księga jest pusta</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Dodaj pierwszy zabieg — oprysk, nawożenie, siew albo zbiór. AgroAgent
        przypomni o karencji i zaktualizuje plan rekomendacji.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
      >
        <Plus className="w-4 h-4" />
        Dodaj pierwszy zabieg
      </button>
    </div>
  );
}

function TreatmentRow({ t }: { t: Treatment }) {
  const karencjaActive =
    t.preHarvestIntervalDays &&
    new Date(t.performedAt).getTime() +
      t.preHarvestIntervalDays * 864e5 >
      Date.now();

  const daysLeft = t.preHarvestIntervalDays
    ? Math.ceil(
        (new Date(t.performedAt).getTime() +
          t.preHarvestIntervalDays * 864e5 -
          Date.now()) /
          864e5,
      )
    : 0;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4 hover:shadow-sm transition">
      <div className="flex items-start gap-4">
        <div className="text-2xl">{getTreatmentTypeIcon(t.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="font-semibold text-gray-900">
                {t.productName}
                {t.doseValue && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    · {t.doseValue} {t.doseUnit} × {t.areaTreated.toFixed(2)} ha
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t.fieldName} ({cropLabel(t.fieldCrop)})
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDatePL(t.performedAt)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {getTreatmentTypeLabel(t.type)}
                </span>
              </div>
              {t.activeSubstance && (
                <div className="text-xs text-gray-400 mt-1">
                  Substancja: {t.activeSubstance}
                </div>
              )}
            </div>
            {karencjaActive && daysLeft > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium whitespace-nowrap">
                <AlertCircle className="w-3 h-3" />
                Karencja: {daysLeft} dni
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTreatmentModal({
  fields,
  onClose,
  onSaved,
}: {
  fields: FieldOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fieldId, setFieldId] = useState(fields[0]?.id ?? '');
  const [type, setType] = useState<string>('spray');
  const [performedAt, setPerformedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [purpose, setPurpose] = useState('');
  const [productName, setProductName] = useState('');
  const [activeSubstance, setActiveSubstance] = useState('');
  const [doseValue, setDoseValue] = useState<string>('');
  const [doseUnit, setDoseUnit] = useState('l/ha');
  const [areaTreated, setAreaTreated] = useState<string>('');
  const [phi, setPhi] = useState<string>('');
  const [operatorName, setOperatorName] = useState('');
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState<CommonProduct[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedField = fields.find((f) => f.id === fieldId);

  const onProductInput = (val: string) => {
    setProductName(val);
    setSuggestions(findProduct(val) as CommonProduct[]);
  };

  const selectSuggestion = (p: CommonProduct) => {
    setProductName(p.name);
    setActiveSubstance(p.substance);
    setDoseValue(p.dose.toString());
    setDoseUnit(p.unit);
    if (p.phi !== null) setPhi(p.phi.toString());
    setSuggestions([]);
  };

  const submit = async () => {
    if (!fieldId || !productName.trim() || !performedAt) {
      toast.error('Uzupełnij wymagane pola.');
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      fieldId,
      performedAt,
      type,
      productName: productName.trim(),
      areaTreated: Number(areaTreated) || selectedField?.areaHectares || 0,
    };
    if (purpose) body.purpose = purpose;
    if (activeSubstance) body.activeSubstance = activeSubstance;
    if (doseValue) body.doseValue = Number(doseValue);
    if (doseUnit) body.doseUnit = doseUnit;
    if (operatorName) body.operatorName = operatorName;
    if (notes) body.notes = notes;
    if (phi) body.preHarvestIntervalDays = Number(phi);

    try {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(typeof data?.error === 'string' ? data.error : 'Nie udało się zapisać');
        setSaving(false);
        return;
      }
      onSaved();
    } catch (err) {
      toast.error(String(err));
      setSaving(false);
    }
  };

  const purposes = TREATMENT_PURPOSES[type as keyof typeof TREATMENT_PURPOSES] ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold">Nowy zabieg</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Field + Date */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pole *">
              <select
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.areaHectares.toFixed(2)} ha
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data wykonania *">
              <input
                type="date"
                value={performedAt}
                onChange={(e) => setPerformedAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </Field>
          </div>

          {/* Type */}
          <Field label="Typ zabiegu *">
            <div className="grid grid-cols-4 gap-2">
              {TREATMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-2.5 rounded-lg border text-xs font-medium transition ${
                    type === t.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-0.5">{t.icon}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Purpose */}
          {purposes.length > 0 && (
            <Field label="Cel">
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Nie wybieraj</option>
                {purposes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Product z suggestions */}
          <Field label="Produkt / nazwa handlowa *">
            <div className="relative">
              <input
                type="text"
                value={productName}
                onChange={(e) => onProductInput(e.target.value)}
                placeholder="np. Falcon 460 EC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        {s.substance} · {s.dose} {s.unit}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="Substancja czynna">
            <input
              type="text"
              value={activeSubstance}
              onChange={(e) => setActiveSubstance(e.target.value)}
              placeholder="np. tebukonazol 250 g/l"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </Field>

          {/* Dose */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Dawka">
              <input
                type="number"
                step="0.01"
                value={doseValue}
                onChange={(e) => setDoseValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </Field>
            <Field label="Jednostka">
              <select
                value={doseUnit}
                onChange={(e) => setDoseUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="l/ha">l/ha</option>
                <option value="kg/ha">kg/ha</option>
                <option value="g/ha">g/ha</option>
                <option value="dt/ha">dt/ha</option>
              </select>
            </Field>
            <Field label="Pow. obrobiona (ha)">
              <input
                type="number"
                step="0.01"
                value={areaTreated}
                onChange={(e) => setAreaTreated(e.target.value)}
                placeholder={selectedField?.areaHectares.toFixed(2) ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </Field>
          </div>

          {/* Karencja */}
          {type === 'spray' && (
            <Field label="Karencja (NPR) w dniach">
              <input
                type="number"
                min="0"
                max="365"
                value={phi}
                onChange={(e) => setPhi(e.target.value)}
                placeholder="np. 35 (z etykiety)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </Field>
          )}

          <Field label="Operator">
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Kto wykonał zabieg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </Field>

          <Field label="Uwagi">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Np. warunki, dodatkowe informacje"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Zapisywane do księgi polowej (IJHARS)
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Anuluj
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="px-5 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Zapisuję...' : 'Zapisz zabieg'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
