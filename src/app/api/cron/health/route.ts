// Health check cron — co 15 min sprawdza wszystkie agenty.
// Jeśli agent.status === 'READY' ale gateway nie odpowiada, mark jako 'ERROR'.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenClawClient } from '@/lib/openclaw';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = req.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;
  const vercelSig = req.headers.get('x-vercel-cron');
  return Boolean(vercelSig);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { status: { in: ['READY', 'ERROR'] } },
  });

  const results = { checked: 0, healthy: 0, unhealthy: 0, recovered: 0 };

  for (const agent of agents) {
    if (!agent.serverIp) continue;
    const client = new OpenClawClient(
      agent.serverIp,
      agent.gatewayPort,
      agent.gatewayToken ?? undefined,
    );
    const health = await client.healthCheck();
    results.checked++;

    if (health.ok) {
      if (agent.status === 'ERROR') {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: 'READY', lastHealthCheck: new Date() },
        });
        await prisma.event.create({
          data: {
            farmId: agent.farmId,
            agentId: agent.id,
            type: 'agent.recovered',
            title: 'Agent wrócił do pracy',
          },
        });
        results.recovered++;
      } else {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { lastHealthCheck: new Date() },
        });
      }
      results.healthy++;
    } else {
      if (agent.status === 'READY') {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: 'ERROR', lastHealthCheck: new Date() },
        });
        await prisma.event.create({
          data: {
            farmId: agent.farmId,
            agentId: agent.id,
            type: 'agent.unhealthy',
            title: 'Agent nie odpowiada',
          },
        });
      }
      results.unhealthy++;
    }
  }

  return NextResponse.json(results);
}
