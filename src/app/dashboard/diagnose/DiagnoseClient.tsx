'use client';

import { useRef, useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { ScanLine } from '@/components/brand/ScanLine';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { downscaleImageFile } from '@/lib/ui/image';

interface FieldOpt {
  id: string;
  name: string;
  crop: string;
}

interface DiagnosisResult {
  diagnoza: string;
  pewnosc: 'wysoka' | 'średnia' | 'niska';
  typProblemu: string;
  objawy: string[];
  rekomendacja: {
    pilnosc: 'pilne' | 'w_ciagu_tygodnia' | 'monitoruj';
    akcja: string;
    srodki: Array<{
      typ: string;
      substancja_czynna: string;
      przyklad_handlowy: string;
      dawka: string;
    }>;
    okno_oprysku: string;
  };
  porada_dodatkowa: string;
}

interface Props {
  fields: FieldOpt[];
}

export function DiagnoseClient({ fields }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string>(fields[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Zdjęcie większe niż 20 MB');
      return;
    }
    try {
      // Downscale przed wysyłką — inaczej duże zdjęcie z telefonu przekracza
      // limit body Vercela (4.5 MB) i POST /api/diagnose pada.
      const downscaled = await downscaleImageFile(file);
      setImageData(downscaled);
      setResult(null);
      setError(null);
    } catch {
      toast.error('Nie udało się przetworzyć zdjęcia. Spróbuj inne.');
    }
  };

  const submit = async () => {
    if (!imageData || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData,
          fieldId: fieldId || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Błąd diagnozy');
      } else {
        setResult(data.diagnosis as DiagnosisResult);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImageData(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          Diagnoza z kamery
        </h1>
        <p className="text-muted-foreground mt-1">
          Zrób zdjęcie liścia, łodygi albo chwastu. AgroAgent rozpozna co to i podpowie co zrobić.
        </p>
      </div>

      <div className="relative rounded-lg bg-card border border-border shadow-card p-5 space-y-4 overflow-hidden">
        <NdviKeyline className="absolute inset-x-0 top-0" height={3} />
        {!imageData && (
          <div className="border border-dashed border-border rounded-md p-10 text-center">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Wybierz lub zrób zdjęcie</p>
            <p className="hud-label mb-4">JPG · PNG · MAX 10 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:brightness-110 transition"
            >
              <Camera className="w-4 h-4" />
              Otwórz kamerę / wybierz plik
            </button>
          </div>
        )}

        {imageData && (
          <div className="relative">
            <img
              src={imageData}
              alt="Do diagnozy"
              className="w-full max-h-[400px] object-contain rounded-md border border-border"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center shadow-card hover:border-foreground/30 transition"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        )}

        {fields.length > 0 && (
          <div>
            <label className="hud-label block mb-1">
              Pole (opcjonalnie — pomaga w diagnozie)
            </label>
            <select
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
            >
              <option value="">Nie wybieraj</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="hud-label block mb-1">
            Opis (opcjonalnie)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="np. liście żółte od tygodnia, głównie brzeg pola"
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card text-foreground"
          />
        </div>

        <button
          onClick={submit}
          disabled={!imageData || loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <ScanLine className="w-5 h-5" />
              Analizuję...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Zdiagnozuj
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-signal-drought/10 border border-signal-drought/30 p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-signal-drought flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-display font-semibold tracking-tight text-foreground mb-1">
              Nie udało się zdiagnozować
            </div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </div>
      )}

      {result && <DiagnosisView result={result} />}
    </div>
  );
}

function DiagnosisView({ result }: { result: DiagnosisResult }) {
  // Kolory funkcjonalne — sygnały pilności rekomendacji (dane)
  const urgencyStyle: Record<string, string> = {
    pilne: 'bg-signal-drought/10 border-signal-drought/30 text-foreground',
    w_ciagu_tygodnia: 'bg-signal-heat/10 border-signal-heat/30 text-foreground',
    monitoruj: 'bg-signal-healthy/10 border-signal-healthy/30 text-foreground',
  };
  const urgencyLabel: Record<string, string> = {
    pilne: 'Pilne',
    w_ciagu_tygodnia: 'W ciągu tygodnia',
    monitoruj: 'Monitoruj',
  };
  // Kolory funkcjonalne — poziom pewności diagnozy (dane)
  const pewnoscColor: Record<string, string> = {
    wysoka: 'bg-signal-healthy/15 text-signal-healthy',
    średnia: 'bg-signal-heat/15 text-signal-heat',
    niska: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-card border border-border shadow-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="hud-label mb-1">Diagnoza</div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {result.diagnoza}
            </h2>
          </div>
          <span
            className={`text-xs font-mono tabular font-medium px-2.5 py-1 rounded-md ${pewnoscColor[result.pewnosc] ?? 'bg-muted text-muted-foreground'}`}
          >
            Pewność: {result.pewnosc}
          </span>
        </div>

        {result.objawy && result.objawy.length > 0 && (
          <div>
            <div className="hud-label mb-2">Objawy</div>
            <ul className="space-y-1">
              {result.objawy.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.porada_dodatkowa && (
          <p className="text-sm text-muted-foreground italic">{result.porada_dodatkowa}</p>
        )}
      </div>

      {result.rekomendacja && (
        <div
          className={`rounded-lg border p-6 space-y-4 ${urgencyStyle[result.rekomendacja.pilnosc] ?? 'bg-card border-border'}`}
        >
          <div className="flex items-center justify-between">
            <div className="hud-label">Rekomendacja</div>
            <span className="hud-label px-2.5 py-1 rounded-md border border-border bg-card">
              {urgencyLabel[result.rekomendacja.pilnosc] ?? result.rekomendacja.pilnosc}
            </span>
          </div>

          <p className="font-display font-semibold tracking-tight text-lg text-foreground">
            {result.rekomendacja.akcja}
          </p>

          {result.rekomendacja.srodki && result.rekomendacja.srodki.length > 0 && (
            <div className="space-y-2">
              <div className="hud-label">Sugerowane środki</div>
              {result.rekomendacja.srodki.map((s, i) => (
                <div
                  key={i}
                  className="rounded-md bg-card border border-border p-3 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">{s.substancja_czynna}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.typ} · {s.przyklad_handlowy}
                    </div>
                  </div>
                  <div className="text-xs font-mono tabular font-semibold whitespace-nowrap text-foreground">
                    {s.dawka}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.rekomendacja.okno_oprysku && (
            <div className="text-sm text-foreground">
              <span className="font-medium">Okno oprysku:</span>{' '}
              <span className="font-mono tabular">{result.rekomendacja.okno_oprysku}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
