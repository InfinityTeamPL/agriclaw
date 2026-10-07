// Walidacja daty zabiegu dla księgi polowej (dokument kontrolny IJHARS).
// Wcześniej Date.parse('2026-02-31') dawało 3 marca — zabieg zapisywał się z INNĄ datą
// niż wpisał rolnik, co fałszuje karencję i rotację. Teraz data musi istnieć w kalendarzu.

import { z } from 'zod';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Czy napis YYYY-MM-DD to istniejący dzień kalendarza (bez przeskoku 31 lutego → 3 marca). */
export function isRealCalendarDate(v: string): boolean {
  if (!DATE_ONLY.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const DAY = 864e5;

const validDate = (v: string) =>
  DATE_ONLY.test(v) ? isRealCalendarDate(v) : !Number.isNaN(Date.parse(v));

/**
 * Data zabiegu: YYYY-MM-DD (istniejący dzień) albo pełny ISO datetime.
 * Zakres: do 10 lat wstecz i do 30 dni w przód (planowanie), reszta to pomyłka w roku.
 */
export const treatmentDateSchema = z
  .string()
  .refine(validDate, 'Nieprawidłowa data (oczekiwano istniejącego dnia w formacie RRRR-MM-DD).')
  .refine((v) => {
    const t = Date.parse(DATE_ONLY.test(v) ? `${v}T12:00:00Z` : v);
    const now = Date.now();
    return t >= now - 10 * 365 * DAY && t <= now + 30 * DAY;
  }, 'Data zabiegu jest poza dozwolonym zakresem (10 lat wstecz, 30 dni w przód).');

/** Data planowana może być dalej w przyszłości — sprawdzamy tylko istnienie dnia. */
export const plannedDateSchema = z
  .string()
  .refine(validDate, 'Nieprawidłowa data (oczekiwano istniejącego dnia w formacie RRRR-MM-DD).');
