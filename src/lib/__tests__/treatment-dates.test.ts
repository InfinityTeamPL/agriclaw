import { describe, it, expect } from 'vitest';
import { isRealCalendarDate, treatmentDateSchema, plannedDateSchema } from '@/lib/treatment-dates';
import { rateLimit } from '@/lib/rate-limit';

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);

describe('data zabiegu w księdze polowej', () => {
  it('odrzuca nieistniejące dni zamiast przesuwać je na następny miesiąc', () => {
    expect(isRealCalendarDate('2026-02-31')).toBe(false);
    expect(isRealCalendarDate('2025-02-29')).toBe(false);
    expect(isRealCalendarDate('2024-02-29')).toBe(true);
    expect(treatmentDateSchema.safeParse('2026-02-31').success).toBe(false);
  });

  it('przyjmuje dzisiejszą datę i pełny ISO', () => {
    expect(treatmentDateSchema.safeParse(iso(0)).success).toBe(true);
    expect(treatmentDateSchema.safeParse(new Date().toISOString()).success).toBe(true);
  });

  it('odrzuca pomyłkę w roku (poza 10 lat wstecz i 30 dni w przód)', () => {
    expect(treatmentDateSchema.safeParse(iso(-365 * 11)).success).toBe(false);
    expect(treatmentDateSchema.safeParse(iso(60)).success).toBe(false);
    expect(treatmentDateSchema.safeParse(iso(10)).success).toBe(true);
  });

  it('data planowana może być dalej w przyszłości, ale dzień musi istnieć', () => {
    expect(plannedDateSchema.safeParse(iso(200)).success).toBe(true);
    expect(plannedDateSchema.safeParse('2026-13-01').success).toBe(false);
  });
});

describe('rateLimit w pamięci', () => {
  it('blokuje po przekroczeniu limitu i liczy osobno dla kluczy', () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(false);
    expect(rateLimit(`${key}:inny`, 2, 60_000).ok).toBe(true);
  });
});
