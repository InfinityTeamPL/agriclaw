'use client';

// Okno oprysku — 72h wizualizacja z Open-Meteo hourly.
// Kolor każdej godziny: zielony=idealne, żółty=marginalne, czerwony=nie pryskaj.

import { useEffect, useState } from 'react';
import { Wind, Droplets, Thermometer, Clock } from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { ScanLine } from '@/components/brand/ScanLine';
import { AdvisoryNotice } from './AdvisoryNotice';
import { formatFixedPL } from '@/lib/ui/format';

interface HourlyPoint {
  time: string;
  temp: number;
  precip: number;
  wind: number;
  windGust: number;
  humidity: number;
  sprayScore: number;
  sprayQuality: 'excellent' | 'good' | 'marginal' | 'poor';
}

interface SprayWindow {
  startIso: string;
  endIso: string;
  durationHours: number;
  avgScore: number;
  quality: HourlyPoint['sprayQuality'];
  label: string;
}

interface Props {
  fieldId?: string;
}

// Kolor DANYCH: jakość oprysku mapowana na sygnały agronomiczne (rampa NDVI /
// signal-*). excellent/good = zieleń zdrowia, marginal = amber upału, poor = oxide.
const qualityColor: Record<HourlyPoint['sprayQuality'], string> = {
  excellent: '#16a34a',
  good: '#84cc16',
  marginal: '#facc15',
  poor: '#dc2626',
};

const qualityLabel: Record<HourlyPoint['sprayQuality'], string> = {
  excellent: 'Idealne',
  good: 'Dobre',
  marginal: 'Słabe',
  poor: 'Nie pryskaj',
};

export function SprayTimer({ fieldId }: Props) {
  const [data, setData] = useState<{ hourly: HourlyPoint[]; topWindows: SprayWindow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<HourlyPoint | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    const qs = fieldId ? `?fieldId=${fieldId}` : '';
    fetch(`/api/weather/spray-window${qs}`)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        // Odpowiedź błędu ({ error }) nie ma tablicy hourly — bez tego sprawdzenia
        // data.hourly.length rzucało TypeError i wywracało całą stronę pola.
        if (!r.ok || !d || !Array.isArray(d.hourly)) throw new Error('bad response');
        return d;
      })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fieldId, attempt]);

  if (loading) {
    return (
      <div className="rounded-lg bg-card border border-border shadow-card p-5 space-y-4">
        <div className="hud-label">Okno oprysku</div>
        <ScanLine className="h-16" label="Skanowanie prognozy…" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="rounded-lg bg-card border border-border shadow-card p-5 space-y-3">
        <div className="hud-label">Okno oprysku</div>
        <p className="text-sm text-muted-foreground">
          Prognoza oprysku jest chwilowo niedostępna.
        </p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="min-h-11 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary transition"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (!data || data.hourly.length === 0) {
    return null;
  }

  // Grupujemy po dniach dla label
  const days: { date: string; label: string; hours: HourlyPoint[] }[] = [];
  // Daty "dziś/jutro" wg czasu Warszawy (a nie UTC), bo czasy z prognozy to czas ścienny pola.
  const dayKey = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
  const today = dayKey(new Date());
  const tomorrow = dayKey(new Date(Date.now() + 864e5));
  for (const h of data.hourly) {
    const date = h.time.slice(0, 10);
    const existing = days.find((d) => d.date === date);
    if (existing) existing.hours.push(h);
    else {
      const label =
        date === today
          ? 'Dziś'
          : date === tomorrow
            ? 'Jutro'
            : new Date(`${date}T12:00:00Z`).toLocaleDateString('pl-PL', {
                timeZone: 'UTC',
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
      days.push({ date, label, hours: [h] });
    }
  }

  const best = data.topWindows[0];

  return (
    <div className="relative rounded-lg bg-card border border-border shadow-card p-5 space-y-4 overflow-hidden">
      <NdviKeyline className="absolute top-0 left-0 right-0" height={3} />

      <div className="flex items-center justify-between">
        <div>
          <div className="hud-label mb-1">Okno oprysku</div>
          <div className="font-display text-lg font-semibold tracking-tight text-foreground">
            Najbliższe 72h
          </div>
          <div className="text-xs text-muted-foreground">wiatr / opad / temp</div>
        </div>
        {best && (
          <div className="text-right">
            <div className="hud-label text-signal-healthy">Najlepsze okno</div>
            <div className="font-mono tabular text-sm font-semibold text-foreground">{best.label}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3">
        {(['excellent', 'good', 'marginal', 'poor'] as const).map((q) => (
          <div key={q} className="inline-flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: qualityColor[q] }}
            />
            <span className="hud-label">{qualityLabel[q]}</span>
          </div>
        ))}
      </div>

      {/* Wykres */}
      <div className="space-y-2 overflow-x-auto">
        {days.map((d) => (
          <div key={d.date} className="flex items-center gap-2">
            <div className="hud-label w-12 shrink-0 text-foreground">
              {d.label}
            </div>
            <div className="flex-1 flex gap-0.5 min-w-[600px]">
              {d.hours.map((h) => (
                <div
                  key={h.time}
                  onMouseEnter={() => setHover(h)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(h)}
                  onFocus={() => setHover(h)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${h.time.slice(11, 16)}: ${qualityLabel[h.sprayQuality]}, wiatr ${Math.round(h.wind)} km/h, opad ${formatFixedPL(h.precip, 1)} mm`}
                  className="flex-1 h-8 rounded-sm cursor-pointer transition-transform hover:scale-y-125 relative group"
                  style={{ background: qualityColor[h.sprayQuality], opacity: 0.9 }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground font-mono tabular opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {Number(h.time.slice(11, 13))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hover details */}
      {hover && (
        <div className="rounded-md bg-secondary border border-border p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono tabular font-semibold text-foreground">
              {new Date(`${hover.time.slice(0, 10)}T12:00:00Z`).toLocaleDateString('pl-PL', {
                timeZone: 'UTC',
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              {hover.time.slice(11, 16)}
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular font-semibold text-white"
              style={{ background: qualityColor[hover.sprayQuality] }}
            >
              {qualityLabel[hover.sprayQuality]} · {hover.sprayScore}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              <span className="font-mono tabular">{formatFixedPL(hover.temp, 1)}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span className="font-mono tabular">{hover.wind.toFixed(0)} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span className="font-mono tabular">{formatFixedPL(hover.precip, 1)} mm</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-signal-frost" />
              <span className="font-mono tabular">{hover.humidity.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 okna */}
      {data.topWindows.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="hud-label">Najlepsze okna</div>
          {data.topWindows.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-secondary border border-border"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-signal-healthy" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{w.label}</div>
                  <div className="hud-label">
                    {w.durationHours} h · score {Math.round(w.avgScore)}
                  </div>
                </div>
              </div>
              <span
                className="text-[10px] font-mono tabular font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: qualityColor[w.quality] }}
              >
                {qualityLabel[w.quality]}
              </span>
            </div>
          ))}
        </div>
      )}

      <AdvisoryNotice compact />
    </div>
  );
}
