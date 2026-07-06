import { describe, it, expect } from 'vitest';
import { assessDiseaseRisks } from '../disease-models';
import type { HourlyPoint } from '../satellite/weather';

// Buduje N godzin spełniających warunki septoriozy (RH>85%, temp 15-25, precip<2).
function septoriaHours(n: number): HourlyPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    time: `2026-06-10T${String(i % 24).padStart(2, '0')}:00`,
    temp: 20,
    precip: 0,
    wind: 5,
    windGust: 8,
    humidity: 90,
    sprayScore: 50,
    sprayQuality: 'good' as const,
  }));
}

describe('disease-models — framing wsparcia decyzji', () => {
  it('wykryta septorioza: zalecenie zawiera weryfikację z etykietą i nie jest rozkazem "PILNE:"', () => {
    const risks = assessDiseaseRisks({
      crop: 'wheat',
      hourly: septoriaHours(14),
      daily: null,
      ndviMean: 0.6,
    });
    const sept = risks.find((r) => /septoria/i.test(r.disease));
    expect(sept).toBeTruthy();
    expect(sept!.action.toLowerCase()).toContain('etykiet');
    expect(sept!.action.toLowerCase()).toContain('rozważ');
    // Żaden action nie zaczyna się od rozkazu "PILNE:" (framing złagodzony)
    for (const r of risks) {
      expect(r.action.startsWith('PILNE:')).toBe(false);
    }
  });

  it('KAŻDE wykryte zalecenie ŚOR zawiera przypomnienie o weryfikacji (etykieta/MRiRW)', () => {
    const risks = assessDiseaseRisks({
      crop: 'wheat',
      hourly: septoriaHours(20),
      daily: null,
      ndviMean: 0.7,
    });
    expect(risks.length).toBeGreaterThan(0);
    for (const r of risks) {
      expect(r.action.toLowerCase()).toMatch(/etykiet|mrirw/);
    }
  });
});
