// Chat z agentem AgriClaw.
// Server component — ładuje farm, jej agenta (jeśli READY) i ostatnią konwersację.
// Renderuje ChatInterface (client) albo CTA do deploya agenta.
//
// Stany:
//   - brak agenta (brak albo DELETED)         → CTA "Uruchom swojego agenta"
//   - PROVISIONING                            → progress + client polling /health
//   - READY                                   → chat
//   - ERROR                                   → komunikat + przycisk "Retry" (DELETE + redeploy)

import Link from 'next/link';
import { Bot, Rocket } from 'lucide-react';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { resolveChatEngine, type ChatEnginePreference } from '@/lib/agent/engine';
import { ChatInterface, type ChatInitialMessage } from '@/components/chat/ChatInterface';
import { AgentProvisioningPanel } from './AgentProvisioningPanel';
import { AgentErrorPanel } from './AgentErrorPanel';
import { EngineSelector } from './EngineSelector';

export const dynamic = 'force-dynamic';

export default async function AgentPage() {
  const { farm } = await requireFarm();

  const agent = await prisma.agent.findFirst({
    where: { farmId: farm.id, status: { not: 'DELETED' } },
    orderBy: { createdAt: 'desc' },
  });

  const isReady = agent?.status === 'READY' && Boolean(agent.serverIp);
  const engine = resolveChatEngine(farm.chatEngine, isReady);

  // Ostatnia konwersacja WYBRANEGO silnika (historie są rozdzielne).
  let initialMessages: ChatInitialMessage[] = [];
  let conversationId: string | null = null;
  if (engine === 'openclaw' || engine === 'agroagent') {
    const lastConversation = await prisma.conversation.findFirst({
      where:
        engine === 'openclaw'
          ? { farmId: farm.id, agentId: agent!.id }
          : {
              farmId: farm.id,
              engine: 'agroagent',
              NOT: { sessionKey: { startsWith: 'agro:wa:' } }, // WhatsApp osobno
            },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });
    if (lastConversation) {
      conversationId = lastConversation.id;
      initialMessages = lastConversation.messages.map((m) => ({
        id: m.id,
        role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
    }
  }

  const mock = agent?.hetznerServerId === 'mock-dev';
  const provisioning = agent?.status === 'PROVISIONING';
  const errored = agent?.status === 'ERROR';

  return (
    // Pełna wysokość i szerokość panelu — czat jest bohaterem strony, nie kartą
    // pływającą w pustce. Nagłówek i statusy się nie rozciągają (shrink-0),
    // resztę miejsca bierze czat (flex-1 min-h-0).
    <div className="h-full flex flex-col p-4 sm:p-6 gap-3">
      {/* Nagłówek: tytuł po lewej, selektor silnika po prawej (przy górnej krawędzi,
          na wysokości profilu/dzwonka z topbara) — nie zabiera miejsca rozmowie. */}
      <div className="flex items-start justify-between gap-3 flex-wrap shrink-0">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 font-display tracking-tight">
            <Bot className="w-6 h-6 text-signal-healthy shrink-0" />
            Agent AgriClaw
          </h1>
          <p className="text-sm text-muted-foreground">
            Zadaj pytanie o swoje pola. Agent ma dostęp do danych satelitarnych, pogody i rejestru ŚOR.
          </p>
        </div>
        <EngineSelector
          farmId={farm.id}
          current={(farm.chatEngine as ChatEnginePreference) ?? 'auto'}
          hasReadyAgent={isReady}
        />
      </div>

      {/* Status wdrożenia OpenClaw (jeśli w toku/błąd) — niezależnie od silnika */}
      {provisioning && agent && (
        <div className="shrink-0">
          <AgentProvisioningPanel agentId={agent.id} mock={mock} />
        </div>
      )}
      {errored && agent && (
        <div className="shrink-0">
          <AgentErrorPanel agentId={agent.id} />
        </div>
      )}

      {engine === 'openclaw_unavailable' ? (
        <AgentEmptyCTA openclawChosen />
      ) : (
        <ChatInterface
          farmId={farm.id}
          initialConversationId={conversationId}
          initialMessages={initialMessages}
        />
      )}
    </div>
  );
}

function AgentEmptyCTA({ openclawChosen = false }: { openclawChosen?: boolean }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center space-y-4 shadow-card">
      <div className="w-12 h-12 mx-auto rounded-md bg-signal-healthy/10 border border-signal-healthy/30 flex items-center justify-center">
        <Bot className="w-6 h-6 text-signal-healthy" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground font-display tracking-tight">
          {openclawChosen ? 'OpenClaw wymaga wdrożenia agenta' : 'Uruchom swojego agenta'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {openclawChosen
            ? 'Wybrałeś silnik autonomiczny — postaw serwer agenta poniżej albo przełącz się na silnik wbudowany, żeby rozmawiać od razu.'
            : 'Każde gospodarstwo dostaje własnego AgroAgenta, który odpowiada po polsku i czyta dane z Twoich pól.'}
        </p>
      </div>
      <div>
        <Link
          href="/dashboard/agent/deploy"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md hover:brightness-110 transition"
        >
          <Rocket className="w-4 h-4" />
          Uruchom swojego agenta
        </Link>
      </div>
    </div>
  );
}
