import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import { recommendationPush, isPushConfigured } from '../push';

describe('recommendationPush', () => {
  it('tytuł z nazwą pola, treść = pierwsze zdanie akcji, link do pola', () => {
    const p = recommendationPush({
      fieldId: 'f1',
      fieldName: 'Pole 1',
      title: 'Sucho w czasie wschodów',
      action: 'Ok. 3 tygodnie po siewie policz rośliny na 1 m². Nie decyduj o azocie.',
    });
    expect(p.title).toBe('Pole 1: Sucho w czasie wschodów');
    // Skrót „Ok.” nie może rozciąć treści (regresja).
    expect(p.body).toBe('Ok. 3 tygodnie po siewie policz rośliny na 1 m². Nie decyduj o azocie.');
    expect(p.url).toBe('/dashboard/fields/f1');
    expect(p.tag).toBe('rec-f1');
  });

  it('długą akcję ucina do 140 znaków (ekran blokady)', () => {
    const p = recommendationPush({ fieldId: 'f', fieldName: 'P', title: 'T', action: 'a'.repeat(300) });
    expect(p.body.length).toBeLessThanOrEqual(140);
    const w = recommendationPush({ fieldId: 'f', fieldName: 'P', title: 'T', action: 'słowo '.repeat(50) });
    expect(w.body).toMatch(/słowo…$/);
  });
});

describe('isPushConfigured', () => {
  it('bez kluczy VAPID → false (push to dodatek, nie wymóg)', () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    expect(isPushConfigured()).toBe(false);
  });
});
