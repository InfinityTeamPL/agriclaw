// Linki z odpowiedzi agenta (markdown) pochodzą pośrednio z danych użytkownika
// (notatki, nazwy, wiadomości WhatsApp). Schemat `javascript:` w href wykonałby kod po
// kliknięciu, więc przepuszczamy tylko bezpieczne schematy.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/** Zwraca adres, jeśli jest bezpieczny do wstawienia w href, w przeciwnym razie null. */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    // Bez bazy: adresy względne i bez schematu (np. "javascript:...", "//host") odpadają.
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? value : null;
  } catch {
    return null;
  }
}
