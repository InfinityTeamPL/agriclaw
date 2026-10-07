// Web Push wysyła żądanie HTTPS pod adres `endpoint` z subskrypcji — a ten adres podaje
// przeglądarka (czyli użytkownik). Bez listy dozwolonych hostów można zarejestrować
// dowolny adres (np. wewnętrzny) i kazać serwerowi wysłać tam POST (ślepy SSRF).
// Przeglądarki używają wyłącznie usług push swoich producentów.

const ALLOWED_HOST_SUFFIXES = [
  'fcm.googleapis.com', // Chrome, Edge, Opera, Brave, Samsung Internet
  'push.services.mozilla.com', // Firefox
  'notify.windows.com', // Edge (WNS)
  'push.apple.com', // Safari / iOS (web.push.apple.com)
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.port && url.port !== '443') return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/** Ile urządzeń jedno konto może zarejestrować (telefon, laptop, tablet…). */
export const MAX_PUSH_SUBSCRIPTIONS_PER_USER = 10;
