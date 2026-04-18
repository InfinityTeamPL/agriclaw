'use client';

// Okno oprysku — 72h wizualizacja z Open-Meteo hourly.
// Kolor każdej godziny: zielony=idealne, żółty=marginalne, czerwony=nie pryskaj.

import { useEffect, useState } from 'react';
import { Wind, Droplets, Thermometer, Sparkles, Clock } from 'lucide-react';

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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const qs = fieldId ? `?fieldId=${fieldId}` : '';
    fetch(`/api/weather/spray-window${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fieldId]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-gray-200 p-5 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data || data.hourly.length === 0) {
    return null;
  }

  // Grupujemy po dniach dla label
  const days: { date: string; label: string; hours: HourlyPoint[] }[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
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
            : new Date(date).toLocaleDateString('pl-PL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
      days.push({ date, label, hours: [h] });
    }
  }

  const best = data.topWindows[0];

  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-50 ring-1 ring-sky-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-700" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Okno oprysku</div>
            <div className="text-xs text-gray-500">Najbliższe 72h · wiatr / opad / temp</div>
          </div>
        </div>
        {best && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
              Najlepsze okno
            </div>
            <div className="text-sm font-bold text-emerald-900">{best.label}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px]">
        {(['excellent', 'good', 'marginal', 'poor'] as const).map((q) => (
          <div key={q} className="inline-flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: qualityColor[q] }}
            />
            <span className="text-gray-500">{qualityLabel[q]}</span>
          </div>
        ))}
      </div>

      {/* Wykres */}
      <div className="space-y-2 overflow-x-auto">
        {days.map((d) => (
          <div key={d.date} className="flex items-center gap-2">
            <div className="text-[11px] font-semibold text-gray-600 w-12 shrink-0">
              {d.label}
            </div>
            <div className="flex-1 flex gap-0.5 min-w-[600px]">
              {d.hours.map((h) => (
                <div
                  key={h.time}
                  onMouseEnter={() => setHover(h)}
                  onMouseLeave={() => setHover(null)}
                  className="flex-1 h-8 rounded-[3px] cursor-pointer transition-transform hover:scale-y-125 relative group"
                  style={{ background: qualityColor[h.sprayQuality], opacity: 0.9 }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {new Date(h.time).getHours()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hover details */}
      {hover && (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">
              {new Date(hover.time).toLocaleDateString('pl-PL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              {new Date(hover.time).toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ background: qualityColor[hover.sprayQuality] }}
            >
              {qualityLabel[hover.sprayQuality]} · {hover.sprayScore}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-gray-600">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              {hover.temp.toFixed(1)}°C
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {hover.wind.toFixed(0)} km/h
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              {hover.precip.toFixed(1)} mm
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-600" />
              {hover.humidity.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Top 3 okna */}
      {data.topWindows.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-700 mb-1">Najlepsze okna</div>
          {data.topWindows.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{w.label}</div>
                  <div className="text-[10px] text-gray-500">
                    {w.durationHours} h · score {Math.round(w.avgScore)}
                  </div>
                </div>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: qualityColor[w.quality] }}
              >
                {qualityLabel[w.quality]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
