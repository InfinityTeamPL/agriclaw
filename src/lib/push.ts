// Web Push (VAPID) — alerty na telefon bez WhatsApp/SMS i bez zewnętrznych kont.
// Działa na Androidzie (Chrome/Firefox/Edge) i na iOS 16.4+ po dodaniu aplikacji
// do ekranu głównego. Klucze: `npx web-push generate-vapid-keys` → env:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…)

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

export interface PushPayload {
  title: string;
  body: string;
  /** Ścieżka w aplikacji otwierana po kliknięciu powiadomienia. */
  url?: string;
  /** Ten sam tag zastępuje poprzednie powiadomienie (np. jedno na pole). */
  tag?: string;
}

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contact@infinityteam.io', pub, priv);
  return (configured = true);
}

/**
 * Wysyła do wszystkich urządzeń użytkownika. Wygasłe subskrypcje (404/410) kasuje.
 * Nigdy nie rzuca — push to dodatek, nie może wywrócić crona ani analizy.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  if (!isPushConfigured()) return { sent: 0, removed: 0 };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 12 * 3600, urgency: 'high' },
        );
        sent++;
        await prisma.pushSubscription.update({ where: { id: s.id }, data: { lastSuccessAt: new Date() } });
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          removed++;
        } else {
          console.warn('[push] send failed', code ?? String(err));
        }
      }
    }),
  );
  return { sent, removed };
}

/** Treść powiadomienia z rekomendacji — krótko, bo ekran blokady ucina po ~2 liniach. */
export function recommendationPush(rec: {
  fieldId: string;
  fieldName: string;
  title: string;
  action: string;
}): PushPayload {
  return {
    title: `${rec.fieldName}: ${rec.title}`,
    body: clip(rec.action, 140),
    url: `/dashboard/fields/${rec.fieldId}`,
    tag: `rec-${rec.fieldId}`,
  };
}

/** Ucina na granicy słowa. Bez dzielenia na zdania — „Ok. 3 tygodnie", „np. mocznik"
 *  rozcinały tekst na skrótach w pół myśli. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}
