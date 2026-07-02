'use client';

// Chat z agentem AgriClaw — SSE streaming z /api/chat/stream.
// Wygląd instrumentu: karta bg-card + border, keyline NDVI jako sygnatura,
// markdown w bąbelkach assistant, auto-scroll na nowe wiadomości.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { SimpleMarkdown } from './SimpleMarkdown';

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

const SUGGESTIONS = [
  'Co zrobić z polem za stodołą?',
  'Pokaż prognozę pogody na ten tydzień',
  'Które pole potrzebuje nawożenia?',
  'Kiedy siać rzepak?',
];

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
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.split('\n').find((l) => l.startsWith('data: '));
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

  const send = () => {
    const text = input.trim();
    if (text) void sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="rounded-lg bg-card border border-border shadow-card flex flex-col min-h-[560px] overflow-hidden">
      {/* Sygnatura marki: pasek rampy NDVI jako górna krawędź instrumentu */}
      <NdviKeyline height={3} rounded={false} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-secondary">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-signal-healthy border-2 border-card" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-display font-semibold tracking-tight text-foreground">
                AgroAgent
              </div>
              <span className="inline-flex items-center gap-1.5 border border-border bg-card px-1.5 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy" />
                <span className="hud-label">Online</span>
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Cyfrowy agronom · zna Twoje pola
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
        {messages.length === 0 ? (
          <EmptyChatTip onPick={(q) => void sendMessage(q)} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <MessageBubble message={m} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 sm:p-4 bg-secondary">
        <div className="flex items-end gap-2 rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring transition p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Zapytaj agenta, np. Czy pole za stodołą wymaga nawożenia?"
            className="flex-1 resize-none px-2 py-1.5 bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground max-h-[180px]"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition shrink-0',
              sending || !input.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:brightness-110',
            )}
          >
            <Send className={cn('w-4 h-4', sending && 'animate-pulse')} />
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </div>
        <p className="mt-2 hud-label px-1">
          Enter — wyślij · Shift+Enter — nowa linia
        </p>
      </div>
    </div>
  );
}

function EmptyChatTip({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-16 h-16 rounded-md bg-primary flex items-center justify-center">
          <Bot className="w-7 h-7 text-primary-foreground" />
        </div>
      </motion.div>
      <div className="mt-5 max-w-sm">
        <div className="hud-label mb-1.5">Agronom AI · gotowy</div>
        <div className="font-display text-lg font-semibold text-foreground tracking-tight">
          Agent zna Twoje pola
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Zapytaj po polsku, jak rozmawiasz z sąsiadem. Odpowiedź — w sekundę.
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 * i + 0.2 }}
            className="text-left text-sm rounded-md border border-border bg-card hover:border-primary/50 hover:bg-secondary px-3 py-2.5 transition text-foreground"
          >
            „{s}"
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          isUser
            ? 'bg-foreground text-background'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-md rounded-br-sm'
            : 'bg-card border border-border text-foreground rounded-md rounded-bl-sm shadow-card',
        )}
      >
        {!message.content && message.streaming ? (
          <TypingDots />
        ) : isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="space-y-1.5">
            <SimpleMarkdown text={message.content} />
            {message.streaming && (
              <span className="inline-block w-1.5 h-3 align-baseline bg-signal-healthy ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      className="inline-flex items-center gap-1.5 py-1"
      aria-label="Agent pisze..."
      role="status"
    >
      <span className="typing-dot" />
      <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
      <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
      <style jsx>{`
        .typing-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background-color: hsl(var(--signal-healthy));
          animation: typing-bounce 1.2s infinite ease-in-out;
        }
        @keyframes typing-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0) scale(0.9);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-5px) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
