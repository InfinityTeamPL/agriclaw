'use client';

// Modern wizard dla onboardingu gospodarstwa.
// Krok 1: nazwa gospodarstwa
// Krok 2: adres (z geokodowaniem przez /api/geocode)
// Krok 3: potwierdzenie + mini mapa lokalizacji
// Po sukcesie POST /api/farms → /dashboard

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Loader2,
  MapPin,
  Sprout,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface GeoResult {
  lat: number;
  lon: number;
  displayName?: string;
}

export function OnboardingForm({ defaultName = '' }: { defaultName?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset geo when address changes
  useEffect(() => {
    setGeo(null);
  }, [address]);

  const canNext1 = name.trim().length > 0;
  const canNext2 = geo !== null;

  const handleGeocode = async () => {
    const a = address.trim();
    if (a.length < 3) {
      toast.error('Podaj co najmniej 3 znaki adresu.');
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: a }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Nie znaleziono adresu. Spróbuj bardziej szczegółowo.',
        );
        setGeocoding(false);
        return;
      }
      const result = (await res.json()) as GeoResult;
      setGeo(result);
      toast.success(`Znaleziono: ${result.displayName ?? a}`);
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się wyszukać adresu.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    if (loading || !geo) return;
    const n = name.trim();
    if (!n) return;

    setLoading(true);
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: n,
          address: geo.displayName ?? address.trim(),
          lat: geo.lat,
          lon: geo.lon,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Nie udało się utworzyć gospodarstwa.',
        );
        setLoading(false);
        return;
      }
      toast.success('Gospodarstwo utworzone.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Nieoczekiwany błąd. Spróbuj ponownie.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <StepIndicator step={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-md bg-secondary border border-border mx-auto flex items-center justify-center">
                <Home className="w-5 h-5 text-signal-healthy" />
              </div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                Jak nazywa się Twoje gospodarstwo?
              </h2>
              <p className="text-sm text-muted-foreground">
                Tak będzie widoczne w panelu i w rozmowie z agentem.
              </p>
            </div>
            <div>
              <label htmlFor="farm-name" className="sr-only">
                Nazwa gospodarstwa
              </label>
              <input
                id="farm-name"
                type="text"
                autoFocus
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canNext1) {
                    e.preventDefault();
                    setStep(2);
                  }
                }}
                placeholder="np. Gospodarstwo Kowalski"
                className="w-full px-4 py-3 text-lg border border-input rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
            <StepNav
              canNext={canNext1}
              onNext={() => setStep(2)}
              nextLabel="Dalej"
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-md bg-secondary border border-border mx-auto flex items-center justify-center">
                <MapPin className="w-5 h-5 text-signal-frost" />
              </div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                Gdzie jest Twoje gospodarstwo?
              </h2>
              <p className="text-sm text-muted-foreground">
                Miejscowość i województwo wystarczą — znajdziemy współrzędne.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="farm-address"
                  type="text"
                  required
                  minLength={3}
                  maxLength={500}
                  autoFocus
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (geo) setStep(3);
                      else void handleGeocode();
                    }
                  }}
                  placeholder="np. Zamość, Lubelskie"
                  className="w-full pl-11 pr-32 py-3 text-base border border-input rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding || address.trim().length < 3}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition',
                    geocoding || address.trim().length < 3
                      ? 'bg-secondary text-muted-foreground font-medium cursor-not-allowed'
                      : 'bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110',
                  )}
                >
                  {geocoding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {geocoding ? 'Szukam...' : 'Znajdź'}
                </button>
              </div>

              {geo && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-lg bg-secondary border border-border p-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-signal-healthy shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium text-foreground truncate">
                      {geo.displayName ?? address}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {geo.lat.toFixed(5)}°N, {geo.lon.toFixed(5)}°E
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <StepNav
              canBack
              canNext={canNext2}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextLabel="Dalej"
            />
          </motion.div>
        )}

        {step === 3 && geo && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-md bg-primary mx-auto flex items-center justify-center shadow-card">
                <Sprout className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Wszystko gotowe?</h2>
              <p className="text-sm text-muted-foreground">
                Sprawdź dane i potwierdź. Pola dorysujesz potem na mapie.
              </p>
            </div>

            <div className="rounded-lg bg-card border border-border p-5 space-y-4 shadow-card">
              <SummaryRow icon={<Home className="w-4 h-4 text-signal-healthy" />} label="Nazwa" value={name} />
              <SummaryRow
                icon={<MapPin className="w-4 h-4 text-signal-frost" />}
                label="Adres"
                value={geo.displayName ?? address}
                sub={`${geo.lat.toFixed(5)}°N, ${geo.lon.toFixed(5)}°E`}
              />

              {/* Mini map preview via static tile */}
              <MiniMapPreview lat={geo.lat} lon={geo.lon} />
            </div>

            <StepNav
              canBack={!loading}
              canNext={!loading}
              onBack={() => setStep(2)}
              onNext={handleSubmit}
              nextLabel={loading ? 'Tworzę gospodarstwo...' : 'Utwórz gospodarstwo'}
              loading={loading}
              primary
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Nazwa' },
    { n: 2, label: 'Adres' },
    { n: 3, label: 'Potwierdzenie' },
  ] as const;
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const isActive = s.n === step;
        const isDone = s.n < step;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                  isActive && 'bg-primary text-primary-foreground shadow-card scale-110',
                  isDone && 'bg-primary text-primary-foreground',
                  !isActive && !isDone && 'bg-secondary text-muted-foreground',
                )}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 sm:w-12 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepNav({
  canBack = false,
  canNext,
  onBack,
  onNext,
  nextLabel,
  loading,
  primary,
}: {
  canBack?: boolean;
  canNext: boolean;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  loading?: boolean;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {canBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Wstecz
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={cn(
          'inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm transition',
          canNext
            ? primary
              ? 'bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110'
              : 'bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110'
            : 'bg-secondary text-muted-foreground font-medium cursor-not-allowed',
        )}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {nextLabel}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="hud-label">
          {label}
        </div>
        <div className="text-sm font-medium text-foreground truncate">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function MiniMapPreview({ lat, lon }: { lat: number; lon: number }) {
  // Prosty CSS-based podgląd lokalizacji bez zewnętrznego tile serwera.
  // Wyśrodkowana ikona pinezki na gradient-gridzie — dekoracyjnie.
  return (
    <div className="relative h-36 rounded-lg overflow-hidden border border-border bg-secondary">
      {/* Grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        aria-hidden="true"
      >
        <defs>
          <pattern id="onb-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.22" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#onb-grid)" />
      </svg>

      {/* Concentric glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-primary/25" />
          <div className="absolute inset-8 rounded-full bg-primary flex items-center justify-center shadow-card">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Coords label */}
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-foreground/80 bg-card rounded-md px-1.5 py-0.5 border border-border">
        {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
      </div>
    </div>
  );
}
