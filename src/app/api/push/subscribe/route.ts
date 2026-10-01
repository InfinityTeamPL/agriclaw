// Rejestracja / wyrejestrowanie urządzenia do Web Push (lib/push).

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().min(1).max(500), auth: z.string().min(1).max(200) }),
});

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();
  const parsed = subscriptionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Niepoprawna subskrypcja' }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  // Upsert po endpoincie: ta sama przeglądarka po ponownym zalogowaniu innego
  // użytkownika przechodzi na niego (alerty nie mogą trafiać do poprzedniego konta).
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id, userAgent: req.headers.get('user-agent')?.slice(0, 300) },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireAuth();
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: 'Brak endpointu' }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: user.id } });
  return NextResponse.json({ ok: true });
}
