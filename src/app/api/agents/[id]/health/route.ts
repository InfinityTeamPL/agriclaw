// GET /api/agents/[id]/health — szybki health check bez pełnego fetch agenta.
// Używany przez UI polling podczas provisioningu i w dashboardzie.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { OpenClawClient } from '@/lib/openclaw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();

  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: { farm: { select: { userId: true } } },
  });
  if (!agent || agent.farm.userId !== user.id) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const lastChecked = new Date().toISOString();

  if (agent.status !== 'READY') {
    return NextResponse.json({
      ok: false,
      status: agent.status,
      lastChecked,
    });
  }

  if (agent.hetznerServerId === 'mock-dev') {
    return NextResponse.json({
      ok: true,
      status: 'READY',
      mock: true,
      uptime: 'mock',
      lastChecked,
    });
  }

  if (!agent.serverIp) {
    return NextResponse.json({
      ok: false,
      status: agent.status,
      lastChecked,
      error: 'Missing serverIp',
    });
  }

  const client = new OpenClawClient(
    agent.serverIp,
    agent.gatewayPort,
    agent.gatewayToken ?? '',
  );
  const health = await client.healthCheck();

  if (health.ok) {
    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastHealthCheck: new Date() },
    });
  }

  return NextResponse.json({
    ok: health.ok,
    status: agent.status,
    uptime: health.uptime,
    version: health.version,
    lastChecked,
  });
}
