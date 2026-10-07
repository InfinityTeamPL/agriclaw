import { describe, it, expect } from 'vitest';
import {
  findBestWindows,
  formatSprayWindowLabel,
  isSprayNight,
  warsawWallClock,
  type HourlyPoint,
} from '@/lib/satellite/weather';

// Godzinowa seria jak z Open-Meteo (czas ścienny bez strefy).
function series(day: string, fromHour: number, toHour: number, score = 80): HourlyPoint[] {
  const out: HourlyPoint[] = [];
  for (let h = fromHour; h <= toHour; h++) {
    out.push({
      time: `${day}T${String(h).padStart(2, '0')}:00`,
      temp: 15,
      precip: 0,
      wind: 4,
      windGust: 8,
      humidity: 70,
      sprayScore: score,
      sprayQuality: score >= 75 ? 'excellent' : 'good',
    });
  }
  return out;
}

describe('okna oprysku', () => {
  const NOW = '2026-10-07T14:00';

  it('nie ciągnie okna przez noc (22–4)', () => {
    // 17:00 dziś → 12:00 jutro, wszystko "dobre" — kiedyś dawało „dziś 17:00–13:00".
    const hourly = [...series('2026-10-07', 17, 23), ...series('2026-10-08', 0, 12)];
    const windows = findBestWindows(hourly, 3, 3, NOW);
    // Przy równym score wygrywa dłuższe okno.
    expect(windows.map((w) => w.label)).toEqual(['jutro 04:00–13:00', 'dziś 17:00–22:00']);
    for (const w of windows) {
      expect(w.endIso.slice(0, 10)).toBe(w.startIso.slice(0, 10));
    }
  });

  it('czyta godziny z napisu, bez przesunięcia strefy', () => {
    const label = formatSprayWindowLabel('2026-10-08T05:00', '2026-10-08T08:00', NOW);
    expect(label).toBe('jutro 05:00–09:00');
  });

  it('dla dalszego dnia podaje nazwę dnia tygodnia', () => {
    const label = formatSprayWindowLabel('2026-10-10T06:00', '2026-10-10T09:00', NOW);
    expect(label).toBe('sobota 06:00–10:00');
  });

  it('pomija okna krótsze niż minimum', () => {
    expect(findBestWindows(series('2026-10-07', 15, 16), 3, 3, NOW)).toEqual([]);
  });

  it('rozdziela okna przy luce w danych', () => {
    const hourly = [...series('2026-10-07', 8, 10), ...series('2026-10-07', 13, 16)];
    const windows = findBestWindows(hourly, 3, 3, NOW);
    expect(windows).toHaveLength(2);
  });

  it('noc to 22:00–03:59', () => {
    expect(isSprayNight('2026-10-07T22:00')).toBe(true);
    expect(isSprayNight('2026-10-07T03:00')).toBe(true);
    expect(isSprayNight('2026-10-07T04:00')).toBe(false);
    expect(isSprayNight('2026-10-07T21:00')).toBe(false);
  });

  it('warsawWallClock zwraca format zgodny z Open-Meteo', () => {
    expect(warsawWallClock(new Date('2026-10-07T12:30:00Z'))).toBe('2026-10-07T14:30');
  });
});
