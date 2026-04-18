// Open-Meteo client — darmowy, bez API key
// Używamy forecast + daily aggregates + ET0 (evapotranspiration FAO)
// Docs: https://open-meteo.com/en/docs

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

  const res = await fetch(`${API_URL}?${params.toString()}`);
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
