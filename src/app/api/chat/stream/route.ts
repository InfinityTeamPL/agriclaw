import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OpenClawClient } from '@/lib/openclaw';
import { buildAgriclawSystemPrompt, type FarmContext } from '@/lib/openclaw-prompt';
import { withAdvisoryDisclaimer } from '@/lib/advisory';
import { runAgroAgent } from '@/lib/agent/agro-agent';
import type { LlmMessage } from '@/lib/ai/minimax';
import { chatMessageSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // pętla narzędziowa v2 (kilka rund LLM + DB/API)

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

  // Brak wdrożonego agenta OpenClaw → wbudowany AgroAgent v2 (MiniMax).
  // Chat działa dla KAŻDEGO gospodarstwa od pierwszej sekundy (koniec 409).
  if (!agent || !agent.serverIp) {
    return runBuiltinAgentStream(req, {
      farm: {
        id: farm.id,
        name: farm.name,
        address: farm.address,
        fields: farm.fields,
      },
      conversationId,
      message,
    });
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

      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* już zamknięty */
        }
      };

      // Keep-alive — komentarz SSE co 15 s, żeby proxy nie zerwało połączenia
      // gdy agent długo „myśli" bez emitowania delty.
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15_000);

      // Rozłączenie klienta (zamknął kartę / abort) → przerywamy strumień do
      // przeglądarki. Uwaga: praca agenta (runAgentStream) toczy się dalej do
      // końca i zapisuje odpowiedź ASSISTANT do bazy — CELOWO, żeby po powrocie
      // rolnik zobaczył gotową odpowiedź. Nasłuch usuwamy w finally.
      const onAbort = () => {
        clearInterval(keepAlive);
        safeClose();
      };
      req.signal.addEventListener('abort', onAbort);

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
          // TWARDY BEZPIECZNIK (poza LLM): zalecenie ŚOR bez odwołania do etykiety
          // dostaje doklejone zastrzeżenie — i w streamie, i w zapisie do bazy.
          const finalOutput = withAdvisoryDisclaimer(result.output);
          const appended = finalOutput.slice(result.output.length);
          if (appended) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: appended })}\n\n`),
              );
            } catch {
              /* controller zamknięty */
            }
          }

          await prisma.message.create({
            data: {
              agentId: agent.id,
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: finalOutput,
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
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`,
            ),
          );
        } catch {
          /* połączenie już zamknięte */
        }
      } finally {
        clearInterval(keepAlive);
        req.signal.removeEventListener('abort', onAbort);
        safeClose();
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

// ── Wbudowany AgroAgent v2 (MiniMax) — ten sam kontrakt SSE co ścieżka OpenClaw ──

async function runBuiltinAgentStream(
  req: NextRequest,
  opts: {
    farm: { id: string; name: string; address: string; fields: Array<{ id: string; name: string; crop: string; areaHectares: number }> };
    conversationId?: string;
    message: string;
  },
): Promise<Response> {
  if (!process.env.MINIMAX_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          'Czat AI wymaga konfiguracji MINIMAX_API_KEY (wbudowany agent) albo wdrożenia agenta OpenClaw przez /dashboard/agent.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const conversation = opts.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: opts.conversationId, farmId: opts.farm.id },
      })
    : await prisma.conversation.create({
        data: {
          farmId: opts.farm.id,
          engine: 'agroagent',
          sessionKey: `agro:${opts.farm.id}:${Date.now()}`,
          title: opts.message.slice(0, 40),
        },
      });
  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  // Historia tej rozmowy jako kontekst (ostatnie 12 tur USER/ASSISTANT).
  const past = await prisma.message.findMany({
    where: { conversationId: conversation.id, role: { in: ['USER', 'ASSISTANT'] } },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { role: true, content: true },
  });
  const history: LlmMessage[] = past
    .reverse()
    .map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }) as LlmMessage);

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'USER', content: opts.message },
  });

  const ctx: FarmContext = {
    farmId: opts.farm.id,
    farmName: opts.farm.name,
    address: opts.farm.address,
    fields: opts.farm.fields,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* już zamknięty */
        }
      };
      const send = (obj: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* klient rozłączony */
        }
      };
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* zamknięte */
        }
      }, 15_000);
      const onAbort = () => {
        clearInterval(keepAlive);
        safeClose();
      };
      req.signal.addEventListener('abort', onAbort);

      try {
        send({ type: 'start', conversationId: conversation.id });
        const result = await runAgroAgent({
          farmId: opts.farm.id,
          ctx,
          history,
          userMessage: opts.message,
          onDelta: (text) => send({ type: 'delta', text }),
        });

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: result.content,
            metadata: JSON.stringify({
              engine: 'agroagent',
              model: result.model,
              toolRounds: result.toolRounds,
              tools: result.toolNames,
            }),
          },
        });
        send({ type: 'done', conversationId: conversation.id, model: result.model });
      } catch (err) {
        console.error('agro-agent v2:', err);
        send({
          type: 'error',
          error: 'AgroAgent chwilowo niedostępny. Spróbuj ponownie za chwilę.',
        });
      } finally {
        clearInterval(keepAlive);
        req.signal.removeEventListener('abort', onAbort);
        safeClose();
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
