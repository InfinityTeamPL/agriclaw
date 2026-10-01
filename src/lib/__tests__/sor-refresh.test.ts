// Samonaprawa rejestru ŚOR — regresja z 10.2026: cron przestał działać i rejestr
// stał 3 miesiące na starym wydaniu. Testy pilnują, że stary import wyzwala
// synchronizację w tle, świeży nie, a throttling nie zalewa dane.gov.pl.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../prisma', () => ({ prisma: {} }));

import { refreshIfStale, __resetRefreshStateForTests } from '../sor-registry';

const DAY = 864e5;
const NOW = Date.UTC(2026, 9, 1, 12);

function deps(lastImportDaysAgo: number | null) {
  const sync = vi.fn(async () => ({ status: 'imported' as const, releaseLabel: '30.07.2026' }));
  const schedule = vi.fn();
  return {
    sync,
    schedule,
    d: {
      now: NOW,
      getLastImportAt: async () => (lastImportDaysAgo === null ? null : new Date(NOW - lastImportDaysAgo * DAY)),
      sync,
      schedule,
    },
  };
}

describe('refreshIfStale', () => {
  beforeEach(() => __resetRefreshStateForTests());

  it('świeży import (< 7 dni) → nic nie robi', async () => {
    const { d, sync } = deps(3);
    expect(await refreshIfStale(d)).toBe('fresh');
    expect(sync).not.toHaveBeenCalled();
  });

  it('stary import (3 miesiące, jak w 10.2026) → synchronizacja w tle', async () => {
    const { d, sync, schedule } = deps(87);
    expect(await refreshIfStale(d)).toBe('triggered');
    expect(sync).toHaveBeenCalledOnce();
    expect(schedule).toHaveBeenCalledOnce(); // trzyma funkcję serverless przy życiu
  });

  it('brak jakiegokolwiek importu → synchronizacja', async () => {
    const { d, sync } = deps(null);
    expect(await refreshIfStale(d)).toBe('triggered');
    expect(sync).toHaveBeenCalledOnce();
  });

  it('throttling: druga próba w ciągu 6 h jest pomijana (nie zalewamy dane.gov.pl)', async () => {
    const first = deps(30);
    await refreshIfStale(first.d);
    await Promise.resolve();
    const second = deps(30);
    expect(await refreshIfStale({ ...second.d, now: NOW + 2 * 3600e3 })).toBe('skipped');
    expect(second.sync).not.toHaveBeenCalled();
  });

  it('po 6 h znów próbuje (upstream mógł opublikować nowe wydanie)', async () => {
    const first = deps(30);
    await refreshIfStale(first.d);
    await new Promise((r) => setTimeout(r, 0));
    const later = deps(30);
    expect(await refreshIfStale({ ...later.d, now: NOW + 7 * 3600e3 })).toBe('triggered');
  });

  it('błąd synchronizacji nie wywala wywołującego', async () => {
    const { d } = deps(30);
    const failing = { ...d, sync: async () => { throw new Error('dane.gov.pl 503'); } };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(refreshIfStale(failing)).resolves.toBe('triggered');
    await new Promise((r) => setTimeout(r, 0));
    spy.mockRestore();
  });
});
