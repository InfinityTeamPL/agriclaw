'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Camera,
  Plus,
  X,
  Bug,
  Leaf,
  Snowflake,
  Wrench,
  Sprout,
  HelpCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { cropLabel, formatDateTimePL } from '@/lib/ui/format';

interface FieldOpt {
  id: string;
  name: string;
  crop: string;
}
interface ScoutingItem {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldCrop: string;
  lat: number;
  lon: number;
  tag: string;
  severity: string;
  note: string | null;
  photoUrl: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// Kolory tagów = dane (typ obserwacji). Mapowane na sygnały agronomiczne:
// choroba=disease(fiolet), szkodnik=drought(oxide/czerwień), przymrozek=frost(lód),
// mechaniczne=neutralny, chwasty=healthy(zieleń), inne=muted.
const TAGS = [
  { value: 'disease', label: 'Choroba', icon: Leaf, color: 'text-signal-disease bg-signal-disease/10 ring-signal-disease/25' },
  { value: 'pest', label: 'Szkodnik', icon: Bug, color: 'text-signal-drought bg-signal-drought/10 ring-signal-drought/25' },
  { value: 'frost', label: 'Przymrozek', icon: Snowflake, color: 'text-signal-frost bg-signal-frost/10 ring-signal-frost/25' },
  { value: 'mechanical', label: 'Mechaniczne', icon: Wrench, color: 'text-muted-foreground bg-muted ring-border' },
  { value: 'weed', label: 'Chwasty', icon: Sprout, color: 'text-signal-healthy bg-signal-healthy/10 ring-signal-healthy/25' },
  { value: 'other', label: 'Inne', icon: HelpCircle, color: 'text-muted-foreground bg-muted ring-border' },
] as const;

function tagMeta(value: string) {
  return TAGS.find((t) => t.value === value) ?? TAGS[5];
}

export function ScoutingClient({
  fields,
  initial,
}: {
  fields: FieldOpt[];
  initial: ScoutingItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filterTag, setFilterTag] = useState('all');

  const filtered = initial.filter((s) => filterTag === 'all' || s.tag === filterTag);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            Obserwacje z pola
          </h1>
          <p className="text-muted-foreground mt-1">
            Pinezki z GPS, foto, notatki. Każdą obserwację AgroAgent może sprawdzić.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110 transition shadow-card"
        >
          <Plus className="w-4 h-4" />
          Dodaj obserwację
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setFilterTag('all')}
          className={`hud-label px-3 py-1.5 rounded-md transition ${filterTag === 'all' ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
        >
          Wszystkie ({initial.length})
        </button>
        {TAGS.map((t) => {
          const n = initial.filter((s) => s.tag === t.value).length;
          if (n === 0) return null;
          return (
            <button
              key={t.value}
              onClick={() => setFilterTag(t.value)}
              className={`hud-label px-3 py-1.5 rounded-md ring-1 transition ${
                filterTag === t.value
                  ? 'bg-foreground text-background ring-foreground'
                  : `${t.color} hover:ring-2`
              }`}
            >
              {t.label} ({n})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <ScoutingCard key={s.id} item={s} />
          ))}
        </div>
      )}

      {open && (
        <AddScoutingModal
          fields={fields}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
            toast.success('Obserwacja zapisana.');
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
      <h3 className="font-display font-semibold tracking-tight text-foreground mb-1">Brak obserwacji</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Zrób zdjęcie liścia / chwastu / pinezkuj szkodę. AgroAgent zobaczy i dołączy do
        rekomendacji.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-semibold hover:brightness-110 transition"
      >
        <Plus className="w-4 h-4" />
        Pierwsza obserwacja
      </button>
    </div>
  );
}

function ScoutingCard({ item }: { item: ScoutingItem }) {
  const meta = tagMeta(item.tag);
  const Icon = meta.icon;
  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden hover:shadow-card transition">
      {item.photoUrl && (
        <img
          src={item.photoUrl}
          alt=""
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ring-1 text-xs font-medium ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </div>
          {item.resolvedAt && (
            <span className="hud-label">naprawione</span>
          )}
        </div>
        <div className="text-sm">
          <span className="font-medium text-foreground">{item.fieldName}</span>
          <span className="text-muted-foreground"> · {cropLabel(item.fieldCrop)}</span>
        </div>
        {item.note && <p className="text-sm text-muted-foreground line-clamp-2">{item.note}</p>}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
          <span className="font-mono tabular">{formatDateTimePL(item.createdAt)}</span>
          <span className="font-mono tabular">
            {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}

function AddScoutingModal({
  fields,
  onClose,
  onSaved,
}: {
  fields: FieldOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fieldId, setFieldId] = useState(fields[0]?.id ?? '');
  const [tag, setTag] = useState('disease');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runDiagnose, setRunDiagnose] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState<string | null>(null);

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast.error('GPS niedostępny w tej przeglądarce');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setGpsLoading(false);
        toast.success(`GPS złapany (dokładność ${Math.round(pos.coords.accuracy)} m)`);
      },
      (err) => {
        toast.error('Nie udało się pobrać GPS: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handlePhoto = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Zdjęcie większe niż 8 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!fieldId) return toast.error('Wybierz pole');
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    setSaving(true);
    let aiDiagnosis: string | null = null;

    // Jeśli użytkownik chce — wyślij foto do diagnozy
    if (runDiagnose && photo) {
      try {
        const res = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: photo, fieldId, note: note || undefined }),
        });
        if (res.ok) {
          const d = await res.json();
          aiDiagnosis = JSON.stringify(d.diagnosis ?? null);
          if (d.diagnosis?.diagnoza) {
            setDiagnosisText(d.diagnosis.diagnoza);
            toast.success(`AgroAgent: ${d.diagnosis.diagnoza}`);
          }
        }
      } catch {
        // diagnoza opcjonalna — idziemy dalej
      }
    }

    // Fallback lat/lon — jeśli user nie kliknął GPS, użyj centroidu pola
    let effectiveLat = lat;
    let effectiveLon = lon;
    if (effectiveLat === null || effectiveLon === null) {
      // spróbuj dostać centroid z API fields
      try {
        const fr = await fetch(`/api/fields/${fieldId}`);
        if (fr.ok) {
          const data = await fr.json();
          const poly = data.polygon;
          if (poly?.coordinates?.[0]) {
            const coords = poly.coordinates[0] as [number, number][];
            const avg = coords.reduce(
              (a, c) => ({ lat: a.lat + c[1], lon: a.lon + c[0] }),
              { lat: 0, lon: 0 },
            );
            effectiveLat = avg.lat / coords.length;
            effectiveLon = avg.lon / coords.length;
          }
        }
      } catch {}
    }
    if (effectiveLat === null || effectiveLon === null) {
      toast.error('Nie udało się ustalić lokalizacji — kliknij "Pobierz GPS"');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/scouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId,
          lat: effectiveLat,
          lon: effectiveLon,
          tag,
          severity,
          note: note || null,
          photoUrl: photo,
          aiDiagnosis,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast.error(typeof d?.error === 'string' ? d.error : 'Błąd zapisu');
        setSaving(false);
        return;
      }
      onSaved();
    } catch (err) {
      toast.error(String(err));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-pop w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Nowa obserwacja</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="hud-label block mb-1">Pole</label>
            <select
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-card text-foreground"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({cropLabel(f.crop)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="hud-label block mb-2">Co zauważyłeś?</label>
            <div className="grid grid-cols-3 gap-2">
              {TAGS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTag(t.value)}
                    className={`p-2.5 rounded-md border text-xs font-medium transition ${
                      tag === t.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-foreground hover:border-foreground/30'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="hud-label block mb-1">Intensywność</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition ${
                    severity === s
                      ? s === 'high'
                        ? 'bg-signal-drought text-white border-signal-drought'
                        : s === 'medium'
                          ? 'bg-signal-heat text-white border-signal-heat'
                          : 'bg-signal-healthy text-white border-signal-healthy'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s === 'low' ? 'Niska' : s === 'medium' ? 'Średnia' : 'Wysoka'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="hud-label block mb-2">Zdjęcie</label>
            {!photo && (
              <label className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 transition">
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Zrób zdjęcie lub wybierz plik</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhoto(f);
                  }}
                />
              </label>
            )}
            {photo && (
              <div className="relative">
                <img src={photo} alt="" className="w-full max-h-60 object-cover rounded-md" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-md bg-card/90 border border-border flex items-center justify-center shadow-card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {photo && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={runDiagnose}
                onChange={(e) => setRunDiagnose(e.target.checked)}
                className="rounded text-primary"
              />
              Wyślij zdjęcie do AgroAgent do automatycznej diagnozy (Gemma 4)
            </label>
          )}

          <div>
            <label className="hud-label block mb-1">Notatka</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-card text-foreground resize-none"
              placeholder="np. liście żółte od tygodnia, głównie brzeg pola"
            />
          </div>

          <div className="rounded-md bg-secondary border border-border p-3 flex items-center justify-between gap-2">
            <div>
              <div className="hud-label mb-0.5">Lokalizacja</div>
              <div className="text-[11px] text-muted-foreground font-mono tabular">
                {lat !== null && lon !== null
                  ? `${lat.toFixed(5)}, ${lon.toFixed(5)}`
                  : 'nie ustalona — użyjemy centroidu pola'}
              </div>
            </div>
            <button
              onClick={captureGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-semibold"
            >
              {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Pobierz GPS
            </button>
          </div>

          {diagnosisText && (
            <div className="rounded-md bg-signal-healthy/10 border border-signal-healthy/25 p-3 text-sm text-foreground">
              <b>AgroAgent:</b> {diagnosisText}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border p-5 flex gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md">
            Anuluj
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-md hover:brightness-110 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Zapisuję…' : 'Zapisz obserwację'}
          </button>
        </div>
      </div>
    </div>
  );
}
