// User profile API: PATCH aktualizuje name + phoneNumber.
// Używane przez /dashboard/settings.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional().nullable(),
  phoneNumber: z
    .string()
    .trim()
    .min(6, 'Numer za krótki')
    .max(32, 'Numer za długi')
    .regex(/^\+?[0-9 \-]+$/, 'Numer może zawierać tylko cyfry, spacje i +/-')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export async function PATCH(req: NextRequest) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: { name?: string | null; phoneNumber?: string | null } = {};
  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name?.trim() || null;
  }
  if (parsed.data.phoneNumber !== undefined) {
    const raw = parsed.data.phoneNumber;
    data.phoneNumber = raw ? raw.trim() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Brak zmian' }, { status: 400 });
  }

  // Unikalność phoneNumber
  if (data.phoneNumber) {
    const existing = await prisma.user.findFirst({
      where: { phoneNumber: data.phoneNumber, id: { not: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Ten numer telefonu jest już używany.' },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
    },
  });

  return NextResponse.json(updated);
}
