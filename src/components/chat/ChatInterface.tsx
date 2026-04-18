'use client';

// Chat z agentem AgriClaw — SSE streaming z /api/chat/stream.
// Pokazuje user message → assistant typing → final response.

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ChatInitialMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Props {
  farmId: string;
  initialConversationId: string | null;
  initialMessages: ChatInitialMessage[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export function ChatInterface({
  farmId,
  initialConversationId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
    ]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          conversationId: conversationId ?? undefined,
          message: text,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const err =
          typeof data?.error === 'string' ? data.error : 'Nie udało się wysłać wiadomości.';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, streaming: false, content: `Błąd: ${err}` }
              : m,
          ),
        );
        toast.error(err);
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // SSE parsing
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!line) continue;
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data) as
              | { type: 'start'; conversationId: string }
              | { type: 'delta'; text: string }
              | { type: 'done'; conversationId: string }
              | { type: 'error'; error: string };

            if (parsed.type === 'start') {
              setConversationId(parsed.conversationId);
            } else if (parsed.type === 'delta') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + parsed.text }
                    : m,
                ),
              );
            } else if (parsed.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, streaming: false } : m,
                ),
              );
            } else if (parsed.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        streaming: false,
                        content: m.content || `Błąd: ${parsed.error}`,
                      }
                    : m,
                ),
              );
              toast.error(parsed.error);
            }
          } catch {
            /* pomijamy niepoprawne linie */
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, streaming: false } : m,
        ),
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                streaming: false,
                content: m.content || 'Nieoczekiwany błąd. Spróbuj ponownie.',
              }
            : m,
        ),
      );
      toast.error('Nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl flex flex-col min-h-[520px]">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <EmptyChatTip />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Zapytaj agenta, np. Czy pole za stodołą wymaga nawożenia?"
            className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Enter — wyślij · Shift+Enter — nowa linia
        </p>
      </div>
    </div>
  );
}

function EmptyChatTip() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
        <Bot className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="text-sm max-w-sm">
        Agent zna Twoje pola. Zapytaj, np.: „Co zrobić z polem za stodołą?" albo
        „Pokaż prognozę pogody na ten tydzień".
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={cn(
        'flex gap-3 items-start',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700',
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed',
          isUser
            ? 'bg-emerald-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-900 rounded-tl-sm',
        )}
      >
        {message.content || (message.streaming ? (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <span className="typing-dot" />
            <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
            <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
            <span className="sr-only">Agent pisze...</span>
          </span>
        ) : null)}
        {message.streaming && message.content && (
          <span className="inline-block w-1.5 h-3 align-baseline bg-gray-400 ml-0.5 animate-pulse" />
        )}
      </div>
      <style jsx>{`
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background-color: #6b7280;
          animation: typing 1.2s infinite ease-in-out;
        }
        @keyframes typing {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
