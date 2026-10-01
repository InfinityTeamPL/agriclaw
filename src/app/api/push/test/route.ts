// Powiadomienie testowe na własne urządzenia — rolnik sprawdza, że alerty dochodzą.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { isPushConfigured, sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { user } = await requireAuth();
  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'Powiadomienia nie są skonfigurowane na serwerze (brak kluczy VAPID).' }, { status: 503 });
  }
  const res = await sendPushToUser(user.id, {
    title: 'AgriClaw: powiadomienia działają',
    body: 'Tak będą wyglądać alerty o przymrozku, oknie oprysku i stanie pól.',
    url: '/dashboard',
    tag: 'test',
  });
  return NextResponse.json(res);
}
