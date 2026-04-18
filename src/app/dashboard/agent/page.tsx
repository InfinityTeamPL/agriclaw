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
import { ChatInterface, type ChatInitialMessage } from '@/components/chat/ChatInterface';
import { AgentProvisioningPanel } from './AgentProvisioningPanel';
import { AgentErrorPanel } from './AgentErrorPanel';

export const dynamic = 'force-dynamic';

export default async function AgentPage() {
  const { farm } = await requireFarm();

  const agent = await prisma.agent.findFirst({
    where: { farmId: farm.id, status: { not: 'DELETED' } },
    orderBy: { createdAt: 'desc' },
  });

  const isReady = agent?.status === 'READY';

  // Ostatnia konwersacja (gdy agent READY)
  let initialMessages: ChatInitialMessage[] = [];
  let conversationId: string | null = null;
  if (isReady && agent) {
    const lastConversation = await prisma.conversation.findFirst({
      where: { farmId: farm.id, agentId: agent.id },
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-600" />
          Agent AgriClaw
        </h1>
        <p className="text-sm text-gray-500">
          Zadaj pytanie o swoje pola. Agent ma dostęp do danych satelitarnych i rekomendacji.
        </p>
      </div>

      {!agent ? (
        <AgentEmptyCTA />
      ) : agent.status === 'PROVISIONING' ? (
        <AgentProvisioningPanel agentId={agent.id} mock={mock} />
      ) : agent.status === 'ERROR' ? (
        <AgentErrorPanel agentId={agent.id} />
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

function AgentEmptyCTA() {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <Bot className="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Uruchom swojego agenta</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Każde gospodarstwo dostaje własnego agenta AI, który odpowiada po polsku i czyta dane z
          Twoich pól.
        </p>
      </div>
      <div>
        <Link
          href="/dashboard/agent/deploy"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <Rocket className="w-4 h-4" />
          Uruchom swojego agenta
        </Link>
      </div>
    </div>
  );
}
