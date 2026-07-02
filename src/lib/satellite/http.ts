// Wspólny helper HTTP dla klientów zewnętrznych API (CDSE, Open-Meteo, ULDK,
// Nominatim, Planet, OpenRouter, WhatsApp, Hetzner). Bez timeoutu wiszące
// połączenie blokuje funkcję aż do maxDuration i psuje UX (patrz audyt: brak
// timeoutów). Retry z backoffem tylko dla błędów przejściowych (429/5xx).

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Limit czasu pojedynczej próby (ms). Domyślnie 20 000. */
  timeoutMs?: number;
  /** Liczba ponowień dla 429/5xx/timeoutu (poza pierwszą próbą). Domyślnie 0. */
  retries?: number;
  /** Bazowe opóźnienie backoffu (ms). Domyślnie 500. */
  retryBaseMs?: number;
}

/**
 * fetch z twardym timeoutem (AbortSignal.timeout) i opcjonalnym retry.
 * Rzuca Error z czytelnym komunikatem przy timeoucie lub wyczerpaniu prób.
 */
export async function fetchWithTimeout(
  url: string,
  opts: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = 20_000, retries = 0, retryBaseMs = 500, ...init } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Retry na błędach przejściowych, jeśli zostały próby.
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : retryBaseMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      // AbortSignal.timeout → DOMException 'TimeoutError'
      const isTimeout = err instanceof Error && err.name === 'TimeoutError';
      if (attempt < retries) {
        await sleep(retryBaseMs * Math.pow(2, attempt));
        continue;
      }
      if (isTimeout) {
        throw new Error(`Przekroczono limit czasu (${timeoutMs} ms) dla ${hostOf(url)}`);
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
