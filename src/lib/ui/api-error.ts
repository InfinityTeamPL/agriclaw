// Czytelny komunikat z odpowiedzi błędu API — dla toastów i formularzy.
// Obsługuje: { error: "tekst" } (standard), starszy format Zod flatten()
// ({ error: { fieldErrors, formErrors } }) oraz brak/uszkodzone ciało.

export function apiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === 'string' && err.trim()) return err;
    if (err && typeof err === 'object') {
      const flat = err as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      const firstField = flat.fieldErrors ? Object.values(flat.fieldErrors).flat().find(Boolean) : undefined;
      if (typeof firstField === 'string') return firstField;
      if (flat.formErrors && typeof flat.formErrors[0] === 'string') return flat.formErrors[0];
    }
  }
  return fallback;
}

/**
 * Wywołanie fetch z polskim komunikatem przy awarii sieci i błędnej odpowiedzi.
 * Zwraca { ok, data, message } — nigdy nie rzuca, więc `finally { setLoading(false) }`
 * nie jest potrzebne do ratowania przycisku zawieszonego na „Zapisuję…".
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
  fallbackError = 'Coś poszło nie tak. Spróbuj ponownie.',
): Promise<{ ok: true; data: T; status: number } | { ok: false; message: string; status: number }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    return { ok: false, status: 0, message: 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.' };
  }
  // Wygasła sesja: middleware przekierowuje na /login i fetch dostaje HTML (status 200).
  // Bez tego rolnik widział „Unexpected token <" albo pustą odpowiedź uznaną za sukces.
  if (res.redirected && /\/login(\?|$)/.test(res.url)) {
    return { ok: false, status: 401, message: 'Sesja wygasła. Zaloguj się ponownie i spróbuj jeszcze raz.' };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, status: res.status, message: apiErrorMessage(data, fallbackError) };
  }
  return { ok: true, status: res.status, data: data as T };
}
