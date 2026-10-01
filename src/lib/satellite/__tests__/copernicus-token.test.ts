import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
vi.mock('../http', () => ({ fetchWithTimeout: (...a: unknown[]) => fetchMock(...a) }));

import { CopernicusClient } from '../copernicus';

const poly: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[19, 52], [19.01, 52], [19.01, 52.01], [19, 52]]] };

const json = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;
const tokenRes = (t: string) => json(200, { access_token: t, expires_in: 600 });
const isTokenUrl = (url: unknown) => typeof url === 'string' && url.includes('/token');
const apiCalls = () => fetchMock.mock.calls.filter((c) => !isTokenUrl(c[0])).length;
const tokenCalls = () => fetchMock.mock.calls.filter((c) => isTokenUrl(c[0])).length;

const SCENES = { features: [{ properties: { datetime: '2026-09-30T09:46:20Z', 'eo:cloud_cover': 3 } }] };

beforeEach(() => {
  fetchMock.mockReset(); // klamry: zwrócony mock vitest uznałby za funkcję sprzątającą i wywołał bez argumentów
});

describe('CopernicusClient — token CDSE', () => {
  it('równoległe wywołania dzielą JEDNO żądanie o token (cron: partie po 6 pól)', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      await new Promise((r) => setTimeout(r, 5));
      return isTokenUrl(url) ? tokenRes('T1') : json(200, SCENES);
    });
    const c = new CopernicusClient('id', 'secret');
    await Promise.all([1, 2, 3, 4, 5, 6].map(() => c.searchS2Scenes(poly, '2026-09-01', '2026-10-01')));
    expect(tokenCalls()).toBe(1);
    expect(apiCalls()).toBe(6);
  });

  it('401 → świeży token i dokładnie jedna ponowna próba', async () => {
    let issued = 0;
    fetchMock.mockImplementation(async (url: string, init: { headers?: Record<string, string> }) => {
      if (isTokenUrl(url)) return tokenRes(`T${++issued}`);
      return init.headers?.Authorization === 'Bearer T1'
        ? json(401, { description: 'AccessToken signature expired' })
        : json(200, SCENES);
    });
    const c = new CopernicusClient('id', 'secret');
    const scenes = await c.searchS2Scenes(poly, '2026-09-01', '2026-10-01');
    expect(scenes).toHaveLength(1);
    expect(issued).toBe(2);
  });

  it('dwa razy 401 → błąd (bez pętli)', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      isTokenUrl(url) ? tokenRes('T') : json(401, { description: 'nope' }),
    );
    const c = new CopernicusClient('id', 'secret');
    await expect(c.searchS2Scenes(poly, '2026-09-01', '2026-10-01')).rejects.toThrow(/401/);
    expect(apiCalls()).toBe(2);
  });
});
