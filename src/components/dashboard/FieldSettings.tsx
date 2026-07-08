'use client';

// Ustawienia pola: edycja nazwy, uprawy i DATY SIEWU + usuwanie pola.
// Data siewu prostuje kaskadę fenologiczną (BBCH → przymrozki/upał/azot/choroby),
// która wcześniej liczyła fazę z generycznego kalendarza. Usuwanie respektuje
// e-rejestr: pole z zabiegami jest miękko ukrywane (księga zostaje), API zwraca
// softDeleted i to komunikujemy rolnikowi.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Settings2, Trash2, Loader2, X } from 'lucide-react';
import { cropLabel } from '@/lib/ui/format';

const CROP_OPTIONS: Array<{ value: string; label: string }> = [
  'wheat',
  'barley',
  'rye',
  'oats',
  'corn',
  'rapeseed',
  'potato',
  'sugarbeet',
  'other',
].map((c) => ({ value: c, label: cropLabel(c) }));

export function FieldSettings({
  fieldId,
  initialName,
  initialCrop,
  initialSowingDate,
}: {
  fieldId: string;
  initialName: string;
  initialCrop: string;
  initialSowingDate: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [crop, setCrop] = useState(initialCrop);
  const [sowingDate, setSowingDate] = useState(initialSowingDate ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const dirty =
    name !== initialName ||
    crop !== initialCrop ||
    (sowingDate || null) !== (initialSowingDate ?? null);

  const save = async () => {
    if (saving || !dirty) return;
    if (!name.trim()) {
      toast.error('Nazwa pola nie może być pusta.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          crop,
          // '' → null czyści datę (powrót do kalendarza); inaczej 'YYYY-MM-DD'
          sowingDate: sowingDate ? sowingDate : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
      }
      toast.success('Zapisano ustawienia pola.');
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(`Nie udało się zapisać: ${e instanceof Error ? e.message : 'błąd'}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fields/${fieldId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json().catch(() => ({}))) as { softDeleted?: boolean };
      toast.success(
        data.softDeleted
          ? 'Pole ukryte. Księga polowa (zabiegi) została zachowana zgodnie z przepisami.'
          : 'Pole usunięte.',
      );
      router.push('/dashboard/fields');
    } catch {
      toast.error('Nie udało się usunąć pola.');
      setDeleting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/25 transition"
      >
        <Settings2 className="w-4 h-4" />
        Ustawienia pola
      </button>
    );
  }

  return (
    <div className="w-full sm:w-[22rem] rounded-lg border border-border bg-card shadow-pop p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="hud-label">Ustawienia pola</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <label className="block space-y-1">
        <span className="hud-label">Nazwa</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1">
        <span className="hud-label">Uprawa</span>
        <select
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {CROP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="hud-label">Data siewu / sadzenia</span>
        <input
          type="date"
          value={sowingDate}
          max={todayStr}
          onChange={(e) => setSowingDate(e.target.value)}
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="block text-[11px] text-muted-foreground leading-snug">
          Podaj faktyczną datę, żeby faza rozwoju (BBCH) i alerty były liczone dokładnie.
          Puste = szacowanie z kalendarza uprawy.
        </span>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow-card hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Zapisz
        </button>
      </div>

      {/* Usuwanie — dwustopniowe, z jawnym komunikatem o ochronie księgi */}
      <div className="pt-3 border-t border-border">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition"
          >
            <Trash2 className="w-4 h-4" />
            Usuń pole
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Na pewno? Jeśli pole ma zabiegi, zostanie ukryte, a księga polowa zachowana
              (wymóg kontroli). Bez zabiegów — usunięte trwale.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Tak, usuń
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
