// POST /api/agents/deploy — prowizjonuje agenta OpenClaw na Hetzner VM.
//
// Przepływ:
// 1. Auth + walidacja że user jest właścicielem farmId.
// 2. Odrzuć jeśli istnieje już agent READY/PROVISIONING dla tej farmy (MVP: 1 na farm).
// 3. Wygeneruj gatewayToken + provisionToken.
// 4. Utwórz rekord Agent w DB (status: PROVISIONING) z wypełnionymi markdownami z agri-advisor template.
// 5. Odpal provisioning w tle:
//    - dev bez HETZNER_API_TOKEN -> MOCK (po 3 sek status READY, serverIp 127.0.0.1)
//    - produkcja -> Hetzner createServer, waitForServer, deployAgent przez SSH
// 6. Zwróć {agentId, status: 'PROVISIONING'} natychmiast.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { deployAgentSchema } from '@/lib/schemas';
import { getAgentTemplate, type AgriAdvisorContext } from '@/lib/agent-templates';
import { createServer, waitForServer } from '@/lib/hetzner';
import { deployAgent } from '@/lib/ssh-deploy';
import type { ProvisionConfig } from '@/lib/provision-script';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function getSkillBaseUrl(): string {
  return (
    process.env.AGRICLAW_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function isDevMockMode(): boolean {
  return (
    process.env.NODE_ENV === 'development' && !process.env.HETZNER_API_TOKEN
  );
}

async function runMockProvisioning(agentId: string) {
  // DEV FALLBACK: bez HETZNER_API_TOKEN symulujemy szybki provisioning
  // żeby UI można było wyklikać. Po 3 sekundach ustawiamy status READY
  // z lokalnym IP/portem — oczywiście żaden agent nie jest naprawdę
  // uruchomiony, ale dashboard pokaże zielony status i pozwoli przejść do chatu.
  await new Promise((r) => setTimeout(r, 3000));
  try {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'READY',
        serverIp: '127.0.0.1',
        gatewayPort: 18789,
        hetznerServerId: 'mock-dev',
        cloudServerId: 'mock-dev',
        lastHealthCheck: new Date(),
      },
    });
    await prisma.event.create({
      data: {
        farmId: (await prisma.agent.findUnique({ where: { id: agentId }, select: { farmId: true } }))!.farmId,
        agentId,
        type: 'agent.deployed',
        title: 'Agent utworzony (MOCK dev)',
        detail: 'Dev fallback: brak HETZNER_API_TOKEN, agent oznaczony READY ale nie działa naprawdę.',
      },
    });
  } catch (err) {
    console.error('[deploy] mock provisioning failed', err);
  }
}

interface RunProvisioningParams {
  agentId: string;
  agentName: string;
  farmId: string;
  model: string;
  channel: string;
  channelToken: string;
  gatewayToken: string;
  provisionToken: string;
  workspaceFiles: Record<string, string>;
  skills: string[];
  apiKeys: { anthropic?: string; openai?: string; google?: string };
}

async function runRealProvisioning(params: RunProvisioningParams) {
  const {
    agentId,
    agentName,
    farmId,
    model,
    channel,
    channelToken,
    gatewayToken,
    provisionToken,
    workspaceFiles,
    skills,
    apiKeys,
  } = params;

  const callbackBaseUrl = getSkillBaseUrl();
  const callbackUrl = `${callbackBaseUrl}/api/agents/callback?agentId=${encodeURIComponent(agentId)}`;

  try {
    const { serverId, ip: preBootIp } = await createServer(
      `agriclaw-${agentId.slice(0, 8)}`,
      'cx23',
      process.env.HETZNER_LOCATION || 'hel1',
      agentName,
      // provision URL jest opcjonalny — my wgrywamy skrypt przez SSH,
      // więc user_data cloud-init nie jest potrzebny. Zostawiamy undefined.
      undefined,
    );

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        hetznerServerId: String(serverId),
        cloudServerId: String(serverId),
        serverIp: preBootIp,
      },
    });

    const ip = await waitForServer(serverId, 180_000);
    await prisma.agent.update({
      where: { id: agentId },
      data: { serverIp: ip },
    });

    const config: ProvisionConfig = {
      agentName,
      agentId,
      gatewayToken,
      model,
      channelType: channel,
      channelToken,
      workspaceFiles,
      callbackUrl,
      callbackToken: provisionToken,
      apiKeys,
      skills,
      channelConfig: undefined,
      integrationKeys: undefined,
    };

    await deployAgent({ host: ip, config });

    // Provisioning skrypt sam uderza callback /api/agents/callback
    // z status:"ready". Tutaj tylko inicjalnie oznaczamy że VM jest gotowa.
    await prisma.event.create({
      data: {
        farmId,
        agentId,
        type: 'agent.provisioning',
        title: 'VM utworzona — OpenClaw Gateway startuje',
        detail: `serverId=${serverId} ip=${ip}`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[deploy] real provisioning failed', err);
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ERROR' },
    });
    await prisma.event.create({
      data: {
        farmId,
        agentId,
        type: 'agent.error',
        title: 'Provisioning nie powiódł się',
        detail: message,
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();

  const body = await req.json().catch(() => null);
  const parsed = deployAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { farmId, channel, model } = parsed.data;

  // Ownership
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      fields: {
        select: { id: true, name: true, crop: true, areaHectares: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!farm || farm.userId !== user.id) {
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
  }

  // MVP: tylko jeden agent (READY/PROVISIONING) per farm
  const existing = await prisma.agent.findFirst({
    where: {
      farmId,
      status: { in: ['READY', 'PROVISIONING'] },
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          'Agent już istnieje dla tego gospodarstwa. Usuń go zanim utworzysz nowego.',
        agentId: existing.id,
        status: existing.status,
      },
      { status: 409 },
    );
  }

  const gatewayToken = randomToken(32);
  const provisionToken = randomToken(24);

  const ctx: AgriAdvisorContext = {
    farmId: farm.id,
    farmName: farm.name,
    address: farm.address,
    userName: user.name ?? undefined,
    phoneNumber: user.phoneNumber,
    fields: farm.fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: f.areaHectares,
    })),
    skillBaseUrl: getSkillBaseUrl(),
    skillToken: process.env.OPENCLAW_SKILL_TOKEN || 'dev-skill-token',
  };
  const template = getAgentTemplate('agri-advisor', ctx);

  const integrationKeys = JSON.stringify({
    skillToken: process.env.OPENCLAW_SKILL_TOKEN || 'dev-skill-token',
    platformKeys: {
      anthropic: Boolean(process.env.PLATFORM_ANTHROPIC_KEY),
      openai: Boolean(process.env.PLATFORM_OPENAI_KEY),
      google: Boolean(process.env.PLATFORM_GOOGLE_AI_KEY),
    },
  });

  const agent = await prisma.agent.create({
    data: {
      farmId,
      name: template.name,
      description: `AgroAgent dla ${farm.name}`,
      model,
      channel,
      template: 'agri-advisor',
      status: 'PROVISIONING',
      gatewayPort: 18789,
      gatewayToken,
      provisionToken,
      soulMd: template.soulMd,
      identityMd: template.identityMd,
      heartbeatMd: template.heartbeatMd,
      toolsMd: template.toolsMd,
      bootstrapMd: template.bootstrapMd,
      userMd: template.userMd,
      agentsMd: template.agentsMd,
      integrationKeys,
    },
  });

  await prisma.event.create({
    data: {
      farmId,
      agentId: agent.id,
      type: 'agent.deploy.started',
      title: `Uruchamiam agenta (${channel})`,
      detail: `model=${model}, template=agri-advisor`,
    },
  });

  const workspaceFiles: Record<string, string> = {
    soulMd: template.soulMd,
    identityMd: template.identityMd,
    heartbeatMd: template.heartbeatMd,
    toolsMd: template.toolsMd,
    bootstrapMd: template.bootstrapMd,
    userMd: template.userMd,
    agentsMd: template.agentsMd,
  };

  const apiKeys = {
    anthropic: process.env.PLATFORM_ANTHROPIC_KEY,
    openai: process.env.PLATFORM_OPENAI_KEY,
    google: process.env.PLATFORM_GOOGLE_AI_KEY,
  };

  const skills = [
    'agri-fields',
    'agri-satellite',
    'agri-weather',
    'agri-notify',
  ];

  // Odpal provisioning w tle — NIE blokuj odpowiedzi.
  // waitUntil przedłuża execution time na Vercelu poza return NextResponse.
  if (isDevMockMode()) {
    waitUntil(runMockProvisioning(agent.id));
  } else {
    waitUntil(
      runRealProvisioning({
        agentId: agent.id,
        agentName: template.name,
        farmId,
        model,
        channel,
        channelToken: '',
        gatewayToken,
        provisionToken,
        workspaceFiles,
        skills,
        apiKeys,
      }),
    );
  }

  return NextResponse.json(
    {
      agentId: agent.id,
      status: 'PROVISIONING',
      mock: isDevMockMode(),
    },
    { status: 202 },
  );
}
