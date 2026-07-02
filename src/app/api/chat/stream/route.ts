import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OpenClawClient } from '@/lib/openclaw';
import { buildAgriclawSystemPrompt } from '@/lib/openclaw-prompt';
import { chatMessageSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { farmId, conversationId, message, image } = parsed.data;

  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId: user.id },
    include: {
      fields: { where: { deletedAt: null }, select: { id: true, name: true, crop: true, areaHectares: true } },
      agents: {
        where: { status: 'READY' },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!farm) {
    return new Response(JSON.stringify({ error: 'Farm not found' }), { status: 404 });
  }

  const agent = farm.agents[0];

  if (!agent || !agent.serverIp) {
    return new Response(
      JSON.stringify({
        error: 'Brak aktywnego agenta. Uruchom agenta przez /dashboard/agent.',
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, farmId },
      })
    : await prisma.conversation.create({
        data: {
          farmId,
          agentId: agent.id,
          sessionKey: `agriclaw:${farmId}:${Date.now()}`,
          title: message.slice(0, 40),
        },
      });

  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
    });
  }

  await prisma.message.create({
    data: {
      agentId: agent.id,
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  });

  const systemPrompt = buildAgriclawSystemPrompt({
    farmId: farm.id,
    farmName: farm.name,
    address: farm.address,
    fields: farm.fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      areaHectares: f.areaHectares,
    })),
  });

  const client = new OpenClawClient(
    agent.serverIp,
    agent.gatewayPort,
    agent.gatewayToken ?? undefined,
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const fullInput = `${systemPrompt}\n\n---\n\nRolnik pyta: ${message}`;

      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'start', conversationId: conversation.id })}\n\n`,
          ),
        );

        const result = await client.runAgentStream(
          fullInput,
          [],
          conversation.sessionKey,
          (chunk) => {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`),
              );
            } catch {
              /* controller zamknięty */
            }
          },
          image,
        );

        if (result.success && result.output) {
          await prisma.message.create({
            data: {
              agentId: agent.id,
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: result.output,
              metadata: JSON.stringify({
                tokensUsed: result.tokensUsed,
                model: result.model,
                duration: result.duration,
              }),
            },
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                conversationId: conversation.id,
                tokensUsed: result.tokensUsed,
                model: result.model,
              })}\n\n`,
            ),
          );
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: result.error ?? 'Agent nie zwrócił odpowiedzi',
              })}\n\n`,
            ),
          );
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
