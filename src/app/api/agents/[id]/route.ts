// GET /api/agents/[id] — zwraca status + (jeśli READY) live health check.
// DELETE /api/agents/[id] — oznacza agenta jako DELETED i usuwa Hetzner VM.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { deleteServer } from '@/lib/hetzner';
import { OpenClawClient } from '@/lib/openclaw';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadOwnedAgent(userId: string, agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      farm: { select: { userId: true, name: true } },
    },
  });
  if (!agent || agent.farm.userId !== userId) return null;
  return agent;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const agent = await loadOwnedAgent(user.id, params.id);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  let health: { ok: boolean; uptime?: string; version?: string } | null = null;
  if (agent.status === 'READY' && agent.serverIp) {
    // Dev mock — nie wywołuj realnego healthchecku na 127.0.0.1
    if (agent.hetznerServerId === 'mock-dev') {
      health = { ok: true, uptime: 'mock', version: 'dev' };
    } else {
      const client = new OpenClawClient(
        agent.serverIp,
        agent.gatewayPort,
        agent.gatewayToken ?? '',
      );
      health = await client.healthCheck();
      if (health.ok) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { lastHealthCheck: new Date() },
        });
      }
    }
  }

  return NextResponse.json({
    id: agent.id,
    farmId: agent.farmId,
    farmName: agent.farm.name,
    name: agent.name,
    model: agent.model,
    channel: agent.channel,
    status: agent.status,
    serverIp: agent.serverIp,
    gatewayPort: agent.gatewayPort,
    hetznerServerId: agent.hetznerServerId,
    lastHealthCheck: agent.lastHealthCheck,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    mock: agent.hetznerServerId === 'mock-dev',
    health,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await requireAuth();
  const agent = await loadOwnedAgent(user.id, params.id);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  // Best-effort: usuń VM. Jeśli to mock albo brak serverId, po prostu pomiń.
  if (
    agent.hetznerServerId &&
    agent.hetznerServerId !== 'mock-dev' &&
    process.env.HETZNER_API_TOKEN
  ) {
    try {
      await deleteServer(agent.hetznerServerId);
    } catch (err) {
      console.warn('[agents/delete] failed to delete Hetzner VM', err);
      // Nie blokuj — agent i tak zostanie oznaczony DELETED.
    }
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: { status: 'DELETED' },
  });

  await prisma.event.create({
    data: {
      farmId: agent.farmId,
      agentId: agent.id,
      type: 'agent.deleted',
      title: 'Agent usunięty',
    },
  });

  return NextResponse.json({ ok: true });
}
