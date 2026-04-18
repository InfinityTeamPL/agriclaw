'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Zdjęcie większe niż 10 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Camera className="w-8 h-8 text-emerald-700" />
          Diagnoza z kamery
        </h1>
        <p className="text-gray-500 mt-1">
          Zrób zdjęcie liścia, łodygi albo chwastu. AgroAgent rozpozna co to i podpowie co zrobić.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4">
        {!imageData && (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">Wybierz lub zrób zdjęcie</p>
            <p className="text-gray-500 text-sm mb-4">JPG, PNG, max 10 MB</p>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700"
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
              className="w-full max-h-[400px] object-contain rounded-xl border border-gray-200"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        )}

        {fields.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pole (opcjonalnie — pomaga w diagnozie)
            </label>
            <select
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis (opcjonalnie)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="np. liście żółte od tygodnia, głównie brzeg pola"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={!imageData || loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
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
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-900 mb-1">Nie udało się zdiagnozować</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {result && <DiagnosisView result={result} />}
    </div>
  );
}

function DiagnosisView({ result }: { result: DiagnosisResult }) {
  const urgencyStyle: Record<string, string> = {
    pilne: 'bg-red-50 border-red-200 text-red-900',
    w_ciagu_tygodnia: 'bg-amber-50 border-amber-200 text-amber-900',
    monitoruj: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };
  const urgencyLabel: Record<string, string> = {
    pilne: 'Pilne',
    w_ciagu_tygodnia: 'W ciągu tygodnia',
    monitoruj: 'Monitoruj',
  };
  const pewnoscColor: Record<string, string> = {
    wysoka: 'bg-emerald-100 text-emerald-800',
    średnia: 'bg-amber-100 text-amber-800',
    niska: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 mb-1">
              Diagnoza
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{result.diagnoza}</h2>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${pewnoscColor[result.pewnosc] ?? 'bg-gray-100 text-gray-700'}`}
          >
            Pewność: {result.pewnosc}
          </span>
        </div>

        {result.objawy && result.objawy.length > 0 && (
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">
              Objawy
            </div>
            <ul className="space-y-1">
              {result.objawy.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.porada_dodatkowa && (
          <p className="text-sm text-gray-600 italic">{result.porada_dodatkowa}</p>
        )}
      </div>

      {result.rekomendacja && (
        <div
          className={`rounded-2xl border p-6 space-y-4 ${urgencyStyle[result.rekomendacja.pilnosc] ?? 'bg-gray-50 border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider">Rekomendacja</div>
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/70">
              {urgencyLabel[result.rekomendacja.pilnosc] ?? result.rekomendacja.pilnosc}
            </span>
          </div>

          <p className="font-semibold text-lg">{result.rekomendacja.akcja}</p>

          {result.rekomendacja.srodki && result.rekomendacja.srodki.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider opacity-70">
                Sugerowane środki
              </div>
              {result.rekomendacja.srodki.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/60 backdrop-blur-sm p-3 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-sm">{s.substancja_czynna}</div>
                    <div className="text-xs opacity-70">
                      {s.typ} · {s.przyklad_handlowy}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold whitespace-nowrap">
                    {s.dawka}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.rekomendacja.okno_oprysku && (
            <div className="text-sm">
              <span className="font-medium">Okno oprysku:</span>{' '}
              {result.rekomendacja.okno_oprysku}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
