'use client';

// „Dziś" — widok startowy w podejściu „najpierw akcja" (jak u liderów agtech,
// np. Tend): jedno zdanie stanu gospodarstwa, krótka lista pól wymagających
// uwagi i pogoda/okno oprysku, czyli to, o co rolnik pyta rano. Zastępuje
// nagłówek + dwa banery + 5 kafelków, które mówiły sprzeczne rzeczy.

import Link from 'next/link';
import {
  ArrowUpRight,
  CloudRain,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Radar,
  Sprout,
  Wind,
} from 'lucide-react';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { ndviColorHex } from '@/lib/design/ndvi-scale';
import { pluralPL, severityStyle, formatHa, formatDatePL, formatIndexPL } from '@/lib/ui/format';
import { cn } from '@/lib/utils';

export interface AttentionItem {
  id: string;
  fieldId: string;
  fieldName: string;
  severity: string;
  title: string;
  createdAt: string;
  ndviMean: number | null;
  /** Najważniejsza przesłanka (warstwa „dlaczego"), np. „NDVI 0,32 · próg poniżej 0,35". */
  reason?: string | null;
}

export interface TodayWeather {
  tempMax: number;
  tempMin: number;
  precip: number;
  windMax: number;
  precipNext3: number;
  days: Array<{ date: string; tempMax: number; tempMin: number; precip: number }>;
}

interface Props {
  farmName: string;
  address: string;
  attention: AttentionItem[];
  attentionTotal: number;
  weather: TodayWeather | null;
  sprayWindow: { label: string; quality: string } | null;
  stats: {
    fieldsCount: number;
    totalHa: number;
    lastAnalysisAt: string | null;
    complianceScore: number;
  };
  scanning: boolean;
  onScan: () => void;
}

const SPRAY_QUALITY: Record<string, string> = {
  excellent: 'bardzo dobre',
  good: 'dobre',
  marginal: 'na granicy',
  poor: 'słabe',
};

function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (d <= 0) return 'dziś';
  if (d === 1) return 'wczoraj';
  return `${d} dni temu`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Warsaw',
  });
}

function dayShort(iso: string, i: number): string {
  if (i === 0) return 'Dziś';
  if (i === 1) return 'Jutro';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pl-PL', { weekday: 'short' });
}

export function TodayBriefing({
  farmName,
  address,
  attention,
  attentionTotal,
  weather,
  sprayWindow,
  stats,
  scanning,
  onScan,
}: Props) {
  const headline =
    stats.fieldsCount === 0
      ? 'Dodaj pierwsze pole, a zacznę je obserwować z satelity.'
      : attentionTotal === 0
        ? `Wszystkie ${stats.fieldsCount} ${pluralPL(stats.fieldsCount, 'pole', 'pola', 'pól')} w normie.`
        : `${attentionTotal} ${pluralPL(attentionTotal, 'pole wymaga', 'pola wymagają', 'pól wymaga')} uwagi.`;

  return (
    <section className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
      <NdviKeyline height={3} rounded={false} />
      {/* grid-cols-1 = minmax(0,1fr): bez tego niejawna kolumna „auto" rośnie do szerokości
          tekstu z truncate (nowrap) i na telefonie treść była ucięta z prawej (553 px na 375). */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Stan + co zrobić */}
        <div className="min-w-0 p-5 sm:p-7">
          <div className="hud-label first-letter:uppercase">{todayLabel()}</div>
          <h1 className="mt-2 font-display text-2xl sm:text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
            Dzień dobry. {headline}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {farmName} · {address}
          </p>

          {attention.length > 0 && (
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {attention.map((a) => {
                const sev = severityStyle(a.severity);
                return (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/fields/${a.fieldId}`}
                      className="group flex items-center gap-3 py-3 -mx-2 px-2 rounded-md hover:bg-secondary transition"
                    >
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                          sev.pill,
                        )}
                      >
                        {sev.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">{a.fieldName}</div>
                        <div className="text-sm text-muted-foreground">
                          {a.title} <span className="text-muted-foreground/70">· {ago(a.createdAt)}</span>
                        </div>
                        {a.reason && (
                          <div className="mt-0.5 font-mono tabular text-[11px] text-muted-foreground/80 break-words">
                            dlaczego: {a.reason}
                          </div>
                        )}
                      </div>
                      {a.ndviMean !== null && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: ndviColorHex(a.ndviMean) }}
                          />
                          NDVI {formatIndexPL(a.ndviMean)}
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {attentionTotal > attention.length && (
            <Link href="/dashboard/fields" className="mt-2 inline-block text-sm text-primary hover:underline">
              + {attentionTotal - attention.length} więcej
            </Link>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onScan}
              disabled={scanning || stats.fieldsCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              {scanning ? 'Skanuję…' : 'Skanuj pola'}
            </button>
            <Link
              href="/dashboard/agent"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary transition"
            >
              <MessageSquare className="w-4 h-4" />
              Zapytaj agenta
            </Link>
            <Link
              href="/dashboard/fields/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary transition"
            >
              <Plus className="w-4 h-4" />
              Dodaj pole
            </Link>
          </div>
        </div>

        {/* Pogoda i okno oprysku */}
        <aside className="border-t xl:border-t-0 xl:border-l border-border bg-secondary/40 p-5 sm:p-6 flex flex-col gap-4">
          <div className="hud-label">Pogoda u Ciebie</div>
          {weather ? (
            <>
              <div className="flex items-end gap-2">
                <span className="font-display text-4xl font-semibold tracking-tight text-foreground tabular">
                  {Math.round(weather.tempMax)}°
                </span>
                <span className="text-sm text-muted-foreground mb-1.5 tabular">
                  / {Math.round(weather.tempMin)}° w nocy
                </span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4" />
                  <span className="tabular">{weather.precip.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} mm</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wind className="w-4 h-4" />
                  <span className="tabular">do {Math.round(weather.windMax)} km/h</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {weather.days.map((d, i) => (
                  <div key={d.date} className="rounded-md bg-card border border-border px-2 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground capitalize">{dayShort(d.date, i)}</div>
                    <div className="text-sm font-medium text-foreground tabular">
                      {Math.round(d.tempMax)}° <span className="text-muted-foreground">{Math.round(d.tempMin)}°</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular">
                      {d.precip > 0.2 ? `${d.precip.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} mm` : 'sucho'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Prognoza chwilowo niedostępna.</p>
          )}
          <div className="rounded-md bg-card border border-border p-3">
            <div className="hud-label mb-1">Najlepsze okno oprysku</div>
            {sprayWindow ? (
              <div className="text-sm text-foreground">
                <span className="font-semibold">{sprayWindow.label}</span>
                <span className="text-muted-foreground"> · warunki {SPRAY_QUALITY[sprayWindow.quality] ?? sprayWindow.quality}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Brak dobrego okna w najbliższych 72 h.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Zwarty pasek liczb zamiast pięciu ciężkich kafli */}
      <div className="border-t border-border px-5 sm:px-7 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Sprout className="w-4 h-4 text-signal-healthy" />
          <span className="text-foreground font-medium tabular">{stats.fieldsCount}</span>
          {pluralPL(stats.fieldsCount, 'pole', 'pola', 'pól')}
        </span>
        <span className="text-muted-foreground">
          <span className="text-foreground font-medium tabular">{formatHa(stats.totalHa)}</span> ha
        </span>
        <span className="text-muted-foreground">
          ostatnia analiza{' '}
          <span className="text-foreground font-medium tabular">
            {stats.lastAnalysisAt ? formatDatePL(stats.lastAnalysisAt) : '—'}
          </span>
        </span>
        <Link href="/dashboard/compliance" className="text-muted-foreground hover:text-foreground">
          zgodność ARiMR{' '}
          <span
            className={cn(
              'font-medium tabular',
              stats.complianceScore >= 80
                ? 'text-signal-healthy'
                : stats.complianceScore >= 50
                  ? 'text-signal-heat'
                  : 'text-destructive',
            )}
          >
            {stats.complianceScore}%
          </span>
        </Link>
      </div>
    </section>
  );
}
