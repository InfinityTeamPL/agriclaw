import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createFarmSchema } from '@/lib/schemas';

export async function GET() {
  const { user } = await requireAuth();
  const farms = await prisma.farm.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      fields: { select: { id: true } },
      agents: {
        where: { status: { not: 'DELETED' } },
        select: { id: true, status: true, name: true },
      },
    },
  });
  return NextResponse.json(farms);
}

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => null);
  const parsed = createFarmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = `agri_${crypto.randomBytes(24).toString('hex')}`;
  const farm = await prisma.farm.create({
    data: {
      userId: user.id,
      apiKey,
      ...parsed.data,
    },
  });
  return NextResponse.json(farm, { status: 201 });
}
