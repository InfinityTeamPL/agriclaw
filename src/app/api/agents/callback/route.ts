// POST /api/agents/callback — webhook wywoływany przez skrypt provisioningowy
// na Hetzner VM. Raportuje postęp: "progress", "ready", "error".
//
// Auth: header x-agent-token MUSI match Agent.provisionToken w DB. Brak sesji
// ponieważ wywołanie idzie z zewnątrz (z VM podczas bootu).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CallbackBody {
  status?: 'progress' | 'ready' | 'error';
  step?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');
  const token = req.headers.get('x-agent-token') || '';

  if (!agentId) {
    return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, farmId: true, provisionToken: true, status: true },
  });
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
  if (!agent.provisionToken || agent.provisionToken !== token) {
    return NextResponse.json({ error: 'Invalid callback token' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as CallbackBody;
  const status = body.status ?? 'progress';

  if (status === 'ready') {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'READY',
        lastHealthCheck: new Date(),
      },
    });
    await prisma.event.create({
      data: {
        farmId: agent.farmId,
        agentId,
        type: 'agent.ready',
        title: 'Agent online — OpenClaw Gateway odpowiada',
      },
    });
  } else if (status === 'error') {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ERROR' },
    });
    await prisma.event.create({
      data: {
        farmId: agent.farmId,
        agentId,
        type: 'agent.error',
        title: 'Błąd provisioningu',
        detail: body.message ?? 'unknown',
      },
    });
  } else {
    await prisma.event.create({
      data: {
        farmId: agent.farmId,
        agentId,
        type: 'agent.progress',
        title: body.step ?? 'progress',
      },
    });
  }

  return NextResponse.json({ ok: true });
}
