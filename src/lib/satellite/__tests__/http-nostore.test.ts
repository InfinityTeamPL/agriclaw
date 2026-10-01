import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithTimeout } from '../http';

afterEach(() => vi.unstubAllGlobals());

describe('fetchWithTimeout — cache Next.js', () => {
  it('domyślnie cache: no-store (token CDSE nie może wracać z Data Cache)', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', f);
    await fetchWithTimeout('https://example.com/token', { method: 'POST' });
    expect(f.mock.calls[0][1].cache).toBe('no-store');
  });

  it('jawne cache od wywołującego wygrywa', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', f);
    await fetchWithTimeout('https://example.com/x', { cache: 'force-cache' });
    expect(f.mock.calls[0][1].cache).toBe('force-cache');
  });
});
