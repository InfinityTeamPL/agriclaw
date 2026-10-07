// Open-Meteo client — darmowy, bez API key
// Używamy forecast + daily aggregates + ET0 (evapotranspiration FAO)
// Docs: https://open-meteo.com/en/docs

import { fetchWithTimeout } from './http';

const API_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherDaily {
  dates: string[]; // ISO YYYY-MM-DD per day
  tempMax: number[]; // °C
  tempMin: number[];
  precipitation: number[]; // mm sumaryczne dzienne
  et0: number[]; // FAO evapotranspiration mm
  soilMoistureShallow: number[]; // m3/m3 ECMWF model 0-7cm (proxy jeśli brak SMAP)
  windMaxKmh: number[];
}

export interface WeatherSummary {
  daily: WeatherDaily;
  daysWithoutRain: number; // ile dni z rzędu z opadem < 1mm
  totalPrecipNext7: number; // mm
  avgEt0Next7: number; // mm/dzień
  droughtRiskLevel: 'low' | 'medium' | 'high';
}

export interface HourlyPoint {
  time: string; // ISO
  temp: number; // °C
  precip: number; // mm/h
  wind: number; // km/h
  windGust: number; // km/h
  humidity: number; // %
  sprayScore: number; // 0-100 (wyżej = lepsze okno)
  sprayQuality: 'excellent' | 'good' | 'marginal' | 'poor';
}

export interface SprayWindow {
  startIso: string;
  endIso: string;
  durationHours: number;
  avgScore: number;
  quality: HourlyPoint['sprayQuality'];
  label: string; // np. "jutro 5:30–9:30"
}

export interface SprayForecast {
  location: { lat: number; lon: number };
  generatedAt: string;
  hourly: HourlyPoint[]; // 72h
  topWindows: SprayWindow[]; // Top 3 najlepsze okna oprysku
}

/**
 * Scoruje godzinę pod kątem oprysku (0-100):
 * - wiatr 2-8 km/h = idealne; do 15 OK; powyżej blokada
 * - opad 0 w oknie =-0; >0 natychmiastowa blokada
 * - temp 8-25°C = idealne; <5 lub >28 blokada
 * - RH 50-85% = idealne; <40 ryzyko znoszenia, >92 ryzyko zmywania
 * - brak porywów (wind_gust < 20 km/h)
 */
function scoreSprayHour(h: {
  temp: number;
  precip: number;
  wind: number;
  windGust: number;
  humidity: number;
}): { score: number; quality: HourlyPoint['sprayQuality'] } {
  if (h.precip > 0.2 || h.wind > 18 || h.windGust > 22) {
    return { score: 0, quality: 'poor' };
  }
  if (h.temp < 4 || h.temp > 28) {
    return { score: 10, quality: 'poor' };
  }

  let score = 100;
  // Wiatr — ideal 3-8 km/h
  if (h.wind < 2) score -= 15; // za słaby, znoszenie
  else if (h.wind >= 2 && h.wind <= 10) score -= 0;
  else if (h.wind <= 15) score -= 20;
  else score -= 40;

  // Temperatura — ideal 10-22
  if (h.temp >= 10 && h.temp <= 22) score -= 0;
  else if (h.temp >= 6 && h.temp <= 26) score -= 15;
  else score -= 30;

  // Wilgotność — ideal 55-85%
  if (h.humidity >= 55 && h.humidity <= 85) score -= 0;
  else if (h.humidity >= 40 && h.humidity <= 92) score -= 10;
  else score -= 25;

  // Porywy
  if (h.windGust > 15) score -= 10;

  score = Math.max(0, Math.min(100, score));

  let quality: HourlyPoint['sprayQuality'];
  if (score >= 75) quality = 'excellent';
  else if (score >= 55) quality = 'good';
  else if (score >= 30) quality = 'marginal';
  else quality = 'poor';

  return { score, quality };
}

// Open-Meteo (timezone=Europe/Warsaw) zwraca czas ścienny BEZ strefy: "2026-10-07T17:00".
// Nie parsujemy go przez Date (serwer na Vercelu działa w UTC i przesunąłby godziny o 2 h) —
// godziny i dni czytamy wprost z napisu.
const WARSAW = 'Europe/Warsaw';

/** Ścienny czas Warszawy jako "YYYY-MM-DDTHH:MM" (porównywalny leksykograficznie z czasem z Open-Meteo). */
export function warsawWallClock(at: Date = new Date()): string {
  return at.toLocaleString('sv-SE', { timeZone: WARSAW, hour12: false }).slice(0, 16).replace(' ', 'T');
}

const hourOf = (iso: string): number => Number(iso.slice(11, 13));

/** Noc (22:00–03:59) — wtedy nie pryskamy, więc nie wchodzi do okien. */
export function isSprayNight(iso: string): boolean {
  const h = hourOf(iso);
  return h >= 22 || h < 4;
}

const addHour = (iso: string): string => {
  const h = hourOf(iso) + 1;
  return h === 24 ? '24:00' : String(h).padStart(2, '0') + ':00';
};

export function findBestWindows(
  hourly: HourlyPoint[],
  minHours = 3,
  count = 3,
  nowIso: string = warsawWallClock(),
): SprayWindow[] {
  // Szukamy ciągłych okien 3+ godziny ze score >= 55, bez nocy (22–4) i bez przeskoków czasu.
  const windows: SprayWindow[] = [];
  let start: number | null = null;
  for (let i = 0; i <= hourly.length; i++) {
    const point = hourly[i];
    const good = Boolean(point) && point.sprayScore >= 55 && !isSprayNight(point.time);
    // Okno przerywa też luka w danych (np. po odfiltrowaniu godzin) lub zmiana dnia kalendarzowego.
    const continues =
      good && start !== null && hourly[i - 1].time.slice(0, 10) === point.time.slice(0, 10) && hourOf(point.time) === hourOf(hourly[i - 1].time) + 1;
    if (good && start !== null && !continues) {
      // zamknij poprzednie okno i zacznij nowe od tej godziny
      pushWindow(windows, hourly, start, i, minHours, nowIso);
      start = i;
      continue;
    }
    if (good && start === null) start = i;
    if (!good && start !== null) {
      pushWindow(windows, hourly, start, i, minHours, nowIso);
      start = null;
    }
  }
  windows.sort((a, b) => b.avgScore - a.avgScore || b.durationHours - a.durationHours);
  return windows.slice(0, count);
}

function pushWindow(
  windows: SprayWindow[],
  hourly: HourlyPoint[],
  start: number,
  end: number,
  minHours: number,
  nowIso: string,
) {
  const len = end - start;
  if (len < minHours) return;
  const slice = hourly.slice(start, end);
  const avg = slice.reduce((a, b) => a + b.sprayScore, 0) / slice.length;
  windows.push({
    startIso: hourly[start].time,
    endIso: hourly[end - 1].time,
    durationHours: len,
    avgScore: avg,
    quality: avg >= 75 ? 'excellent' : avg >= 55 ? 'good' : 'marginal',
    label: formatSprayWindowLabel(hourly[start].time, hourly[end - 1].time, nowIso),
  });
}

export function formatSprayWindowLabel(
  startIso: string,
  endIso: string,
  nowIso: string = warsawWallClock(),
): string {
  const day = startIso.slice(0, 10);
  const today = nowIso.slice(0, 10);
  const tomorrow = warsawWallClock(new Date(new Date(today + 'T12:00:00Z').getTime() + 864e5 + 2 * 3600e3)).slice(0, 10);
  const dayLabel =
    day === today
      ? 'dziś'
      : day === tomorrow
        ? 'jutro'
        : new Date(day + 'T12:00:00Z').toLocaleDateString('pl-PL', { timeZone: 'UTC', weekday: 'long' });
  return `${dayLabel} ${startIso.slice(11, 16)}–${addHour(endIso)}`;
}

export async function fetchSprayForecast(
  lat: number,
  lon: number,
): Promise<SprayForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      'temperature_2m',
      'precipitation',
      'wind_speed_10m',
      'wind_gusts_10m',
      'relative_humidity_2m',
    ].join(','),
    timezone: WARSAW,
    forecast_days: '3',
  });
  const res = await fetchWithTimeout(`${API_URL}?${params.toString()}`, { timeoutMs: 15_000, retries: 1 });
  if (!res.ok) throw new Error(`Open-Meteo spray forecast failed: ${res.status}`);
  const data = (await res.json()) as {
    hourly?: {
      time: string[];
      temperature_2m: number[];
      precipitation: number[];
      wind_speed_10m: number[];
      wind_gusts_10m: number[];
      relative_humidity_2m: number[];
    };
  };
  if (!data.hourly) throw new Error('Open-Meteo: brak danych hourly');

  const hourly: HourlyPoint[] = data.hourly.time.map((t, i) => {
    const base = {
      temp: data.hourly!.temperature_2m[i],
      precip: data.hourly!.precipitation[i],
      wind: data.hourly!.wind_speed_10m[i],
      windGust: data.hourly!.wind_gusts_10m[i],
      humidity: data.hourly!.relative_humidity_2m[i],
    };
    const { score, quality } = scoreSprayHour(base);
    return {
      time: t,
      ...base,
      sprayScore: score,
      sprayQuality: quality,
    };
  });

  // Tylko 72 godziny od teraz (ścienny czas Warszawy, bez parsowania przez Date).
  const nowIso = warsawWallClock(new Date(Date.now() - 3600_000));
  const next72h = hourly.filter((p) => p.time >= nowIso);

  const topWindows = findBestWindows(next72h, 3, 3);

  return {
    location: { lat, lon },
    generatedAt: new Date().toISOString(),
    hourly: next72h,
    topWindows,
  };
}

export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  days = 7,
): Promise<WeatherSummary> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'et0_fao_evapotranspiration',
      'wind_speed_10m_max',
    ].join(','),
    hourly: 'soil_moisture_0_to_7cm',
    timezone: 'auto',
    forecast_days: String(Math.min(Math.max(days, 1), 14)),
  });

  const res = await fetchWithTimeout(`${API_URL}?${params.toString()}`, { timeoutMs: 15_000, retries: 1 });
  if (!res.ok) {
    throw new Error(`Open-Meteo failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    daily?: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      et0_fao_evapotranspiration: number[];
      wind_speed_10m_max: number[];
    };
    hourly?: {
      time: string[];
      soil_moisture_0_to_7cm: number[];
    };
  };

  if (!data.daily) throw new Error('Open-Meteo: brak danych daily');

  // Średnie dzienne z wilgotności gleby (hourly → daily)
  const soilMoistureShallow: number[] = [];
  if (data.hourly?.soil_moisture_0_to_7cm) {
    const perDay = new Map<string, number[]>();
    data.hourly.time.forEach((t, i) => {
      const day = t.slice(0, 10);
      const value = data.hourly!.soil_moisture_0_to_7cm[i];
      if (typeof value === 'number') {
        if (!perDay.has(day)) perDay.set(day, []);
        perDay.get(day)!.push(value);
      }
    });
    for (const date of data.daily.time) {
      const values = perDay.get(date) ?? [];
      if (values.length === 0) {
        soilMoistureShallow.push(NaN);
      } else {
        soilMoistureShallow.push(values.reduce((a, b) => a + b, 0) / values.length);
      }
    }
  }

  const daily: WeatherDaily = {
    dates: data.daily.time,
    tempMax: data.daily.temperature_2m_max,
    tempMin: data.daily.temperature_2m_min,
    precipitation: data.daily.precipitation_sum,
    et0: data.daily.et0_fao_evapotranspiration,
    soilMoistureShallow,
    windMaxKmh: data.daily.wind_speed_10m_max,
  };

  let daysWithoutRain = 0;
  for (const p of daily.precipitation) {
    if (p < 1) daysWithoutRain++;
    else break;
  }

  const totalPrecipNext7 = daily.precipitation.slice(0, 7).reduce((a, b) => a + b, 0);
  const validEt0 = daily.et0.slice(0, 7).filter((e) => !Number.isNaN(e));
  const avgEt0Next7 = validEt0.length ? validEt0.reduce((a, b) => a + b, 0) / validEt0.length : 0;

  let droughtRiskLevel: WeatherSummary['droughtRiskLevel'] = 'low';
  if (daysWithoutRain >= 5 && totalPrecipNext7 < 5 && avgEt0Next7 > 3.5) {
    droughtRiskLevel = 'high';
  } else if (daysWithoutRain >= 3 || (totalPrecipNext7 < 10 && avgEt0Next7 > 3)) {
    droughtRiskLevel = 'medium';
  }

  return {
    daily,
    daysWithoutRain,
    totalPrecipNext7,
    avgEt0Next7,
    droughtRiskLevel,
  };
}
