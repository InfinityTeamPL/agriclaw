'use client';

// Diagnoza roślin domowych/doniczkowych z kamery — osobna funkcja od diagnozy
// polowej. Bez wyboru pola i bez rejestru ŚOR; zamiast tego plan pielęgnacji
// i domowe metody na szkodniki.

import { useRef, useState } from 'react';
import {
  Flower2,
  AlertCircle,
  Upload,
  X,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  Sprout,
  Leaf,
  Bug,
} from 'lucide-react';
import { toast } from 'sonner';
import { ScanLine } from '@/components/brand/ScanLine';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { downscaleImageFile } from '@/lib/ui/image';

interface CarePlan {
  podlewanie?: string;
  swiatlo?: string;
  wilgotnosc?: string;
  temperatura?: string;
  nawozenie?: string;
}

interface HomeRemedy {
  metoda: string;
  jak?: string;
  kiedy?: string;
}

interface HouseplantResult {
  roslina: string;
  pewnosc: 'wysoka' | 'średnia' | 'niska';
  stanOgolny?: string;
  typProblemu: string;
  diagnoza: string;
  objawy?: string[];
  pielegnacja?: CarePlan;
  rekomendacja?: {
    pilnosc: 'pilne' | 'w_ciagu_tygodnia' | 'obserwuj';
    akcja: string;
    domoweSrodki?: HomeRemedy[];
  };
  porada_dodatkowa?: string;
  kiedy_do_eksperta?: string;
}

export function HouseplantClient() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const fileReqRef = useRef(0);
  const [imageData, setImageData] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HouseplantResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Zdjęcie większe niż 20 MB');
      return;
    }
    const token = ++fileReqRef.current;
    try {
      const downscaled = await downscaleImageFile(file);
      if (token !== fileReqRef.current) return;
      setImageData(downscaled);
      setResult(null);
      setError(null);
    } catch {
      if (token !== fileReqRef.current) return;
      toast.error('Nie udało się przetworzyć zdjęcia. Spróbuj inne.');
    }
  };

  const submit = async () => {
    if (!imageData || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/houseplant-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageData, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Błąd diagnozy');
      } else {
        setResult(data.diagnosis as HouseplantResult);
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
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
          <Flower2 className="w-8 h-8 text-primary" />
          Rośliny domowe
        </h1>
        <p className="text-muted-foreground mt-1">
          Zrób zdjęcie kwiatka lub rośliny doniczkowej. Rozpoznam gatunek, powiem co jej dolega i
          jak o nią zadbać — bez środków rolniczych, domowymi sposobami.
        </p>
      </div>

      <div className="relative rounded-lg bg-card border border-border shadow-card p-5 space-y-4 overflow-hidden">
        <NdviKeyline className="absolute inset-x-0 top-0" height={3} />
        {!imageData && (
          <div className="border border-dashed border-border rounded-md p-10 text-center">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Wybierz lub zrób zdjęcie rośliny</p>
            <p className="hud-label mb-4">JPG · PNG · MAX 20 MB · zbliżenie liścia pomaga</p>
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
              <Flower2 className="w-4 h-4" />
              Otwórz kamerę / wybierz plik
            </button>
          </div>
        )}

        {imageData && (
          <div className="relative">
            <img
              src={imageData}
              alt="Roślina do diagnozy"
              className="w-full max-h-[400px] object-contain rounded-md border border-border"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center shadow-card hover:border-foreground/30 transition"
              aria-label="Usuń zdjęcie"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        )}

        <div>
          <label className="hud-label block mb-1">Opis (opcjonalnie)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="np. liście żółkną od 2 tygodni, stoi przy oknie północnym, podlewam co 3 dni"
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
              Rozpoznaję…
            </>
          ) : (
            <>
              <Flower2 className="w-5 h-5" />
              Rozpoznaj i zdiagnozuj
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-signal-drought/10 border border-signal-drought/30 p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-signal-drought flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-display font-semibold tracking-tight text-foreground mb-1">
              Nie udało się rozpoznać
            </div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </div>
      )}

      {result && <HouseplantView result={result} />}
    </div>
  );
}

function HouseplantView({ result }: { result: HouseplantResult }) {
  const urgencyStyle: Record<string, string> = {
    pilne: 'bg-signal-drought/10 border-signal-drought/30',
    w_ciagu_tygodnia: 'bg-signal-heat/10 border-signal-heat/30',
    obserwuj: 'bg-signal-healthy/10 border-signal-healthy/30',
  };
  const urgencyLabel: Record<string, string> = {
    pilne: 'Pilne',
    w_ciagu_tygodnia: 'W ciągu tygodnia',
    obserwuj: 'Obserwuj',
  };
  const pewnoscColor: Record<string, string> = {
    wysoka: 'bg-signal-healthy/15 text-signal-healthy',
    średnia: 'bg-signal-heat/15 text-signal-heat',
    niska: 'bg-muted text-muted-foreground',
  };

  const care: Array<{ icon: typeof Droplets; label: string; value?: string }> = [
    { icon: Droplets, label: 'Podlewanie', value: result.pielegnacja?.podlewanie },
    { icon: Sun, label: 'Światło', value: result.pielegnacja?.swiatlo },
    { icon: Wind, label: 'Wilgotność', value: result.pielegnacja?.wilgotnosc },
    { icon: Thermometer, label: 'Temperatura', value: result.pielegnacja?.temperatura },
    { icon: Sprout, label: 'Nawożenie', value: result.pielegnacja?.nawozenie },
  ].filter((c) => c.value);

  return (
    <div className="space-y-4">
      {/* Rozpoznanie + diagnoza */}
      <div className="rounded-lg bg-card border border-border shadow-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="hud-label mb-1 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-signal-healthy" />
              Rozpoznana roślina
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {result.roslina}
            </h2>
            {result.stanOgolny && (
              <div className="text-sm text-muted-foreground mt-0.5">Stan: {result.stanOgolny}</div>
            )}
          </div>
          <span
            className={`shrink-0 text-xs font-mono tabular font-medium px-2.5 py-1 rounded-md ${pewnoscColor[result.pewnosc] ?? 'bg-muted text-muted-foreground'}`}
          >
            Pewność: {result.pewnosc}
          </span>
        </div>

        <div className="rounded-md bg-secondary border border-border p-3">
          <div className="hud-label mb-1">Diagnoza</div>
          <p className="text-foreground">{result.diagnoza}</p>
        </div>

        {result.objawy && result.objawy.length > 0 && (
          <div>
            <div className="hud-label mb-2">Co widać na zdjęciu</div>
            <ul className="space-y-1">
              {result.objawy.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-signal-healthy shrink-0" />
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

      {/* Plan pielęgnacji */}
      {care.length > 0 && (
        <div className="rounded-lg bg-card border border-border shadow-card p-6 space-y-3">
          <div className="hud-label">Plan pielęgnacji</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {care.map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-3 rounded-md border border-border bg-secondary/40 p-3"
              >
                <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center shrink-0">
                  <c.icon className="w-4 h-4 text-signal-healthy" />
                </div>
                <div className="min-w-0">
                  <div className="hud-label">{c.label}</div>
                  <div className="text-sm text-foreground leading-relaxed">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rekomendacja + domowe metody */}
      {result.rekomendacja && (
        <div
          className={`rounded-lg border p-6 space-y-4 ${urgencyStyle[result.rekomendacja.pilnosc] ?? 'bg-card border-border'}`}
        >
          <div className="flex items-center justify-between">
            <div className="hud-label">Co zrobić</div>
            <span className="hud-label px-2.5 py-1 rounded-md border border-border bg-card">
              {urgencyLabel[result.rekomendacja.pilnosc] ?? result.rekomendacja.pilnosc}
            </span>
          </div>

          <p className="font-display font-semibold tracking-tight text-lg text-foreground">
            {result.rekomendacja.akcja}
          </p>

          {result.rekomendacja.domoweSrodki && result.rekomendacja.domoweSrodki.length > 0 && (
            <div className="space-y-2">
              <div className="hud-label flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5" />
                Domowe metody
              </div>
              {result.rekomendacja.domoweSrodki.map((s, i) => (
                <div key={i} className="rounded-md bg-card border border-border p-3">
                  <div className="font-semibold text-sm text-foreground">{s.metoda}</div>
                  {s.jak && <div className="text-sm text-muted-foreground mt-0.5">{s.jak}</div>}
                  {s.kiedy && (
                    <div className="text-xs font-mono tabular text-muted-foreground mt-1">
                      Kiedy: {s.kiedy}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result.kiedy_do_eksperta && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Kiedy do eksperta:</span>{' '}
          {result.kiedy_do_eksperta}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center px-4">
        Wskazówki pielęgnacyjne mają charakter pomocniczy. Przy roślinach jadalnych lub w domu ze
        zwierzętami sprawdź, czy metoda jest bezpieczna, zanim jej użyjesz.
      </p>
    </div>
  );
}
