// PATCH /api/farms/[id] — ustawienia gospodarstwa edytowalne przez właściciela.
// Na razie jedno pole: chatEngine (wybór silnika czatu AI: auto/agroagent/openclaw).

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { CHAT_ENGINE_VALUES } from '@/lib/agent/engine';

const patchSchema = z.object({
  chatEngine: z.enum(CHAT_ENGINE_VALUES as [string, ...string[]]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  const farm = await prisma.farm.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!farm) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.farm.update({
    where: { id: farm.id },
    data: { chatEngine: parsed.data.chatEngine },
    select: { id: true, chatEngine: true },
  });
  return NextResponse.json(updated);
}
