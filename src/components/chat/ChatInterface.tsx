'use client';

// Chat z agentem AgriClaw — SSE streaming z /api/chat/stream.
// Polerowany design: glass shell, animowane wejścia, typing indicator z bounce,
// markdown w bąbelkach assistant, auto-scroll na nowe wiadomości.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
    <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)] flex flex-col min-h-[560px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 via-white to-sky-50/40">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_6px_20px_-8px_rgba(16,185,129,0.8)]">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-gray-900">AgroAgent</div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <div className="text-xs text-gray-500">Cyfrowy agronom · zna Twoje pola</div>
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
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <MessageBubble message={m} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 p-3 sm:p-4 bg-white/70 backdrop-blur">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Zapytaj agenta, np. Czy pole za stodołą wymaga nawożenia?"
            className="flex-1 resize-none px-2 py-1.5 bg-transparent focus:outline-none text-sm placeholder:text-gray-400 max-h-[180px]"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition shrink-0',
              sending || !input.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:-translate-y-0.5',
            )}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-400 px-1">
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_14px_36px_-10px_rgba(16,185,129,0.7)]">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="absolute inset-0 rounded-3xl animate-ping bg-emerald-500/20" />
      </motion.div>
      <div className="mt-5 max-w-sm">
        <div className="text-lg font-semibold text-gray-900 tracking-tight">
          Agent zna Twoje pola
        </div>
        <div className="text-sm text-gray-500 mt-1">
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
            className="text-left text-sm rounded-2xl border border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 px-3 py-2.5 transition text-gray-700 hover:text-emerald-800"
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
          'shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-2xl rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-md',
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
              <span className="inline-block w-1.5 h-3 align-baseline bg-emerald-600 ml-0.5 animate-pulse" />
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
          background-color: #10b981;
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
