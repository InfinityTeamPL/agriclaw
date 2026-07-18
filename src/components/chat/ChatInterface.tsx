'use client';

// Chat z agentem AgriClaw — SSE streaming z /api/chat/stream.
//
// Layout „instrumentu": karta o STAŁEJ wysokości (flex-1 min-h-0 od rodzica),
// scroll wyłącznie WEWNĄTRZ listy wiadomości — odpowiedź agenta nigdy nie
// rozpycha strony. Mobile-first: 16px w polu (bez iOS-zoom), safe-area,
// przycisk „do dołu" gdy user czyta wyżej podczas streamu.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowDown, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NdviKeyline } from '@/components/brand/NdviKeyline';
import { AgentAvatar } from '@/components/brand/AgentAvatar';
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
  'Czy ten środek jest legalny w mojej uprawie?',
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
  // Widoczny przycisk „przewiń do dołu", gdy user czyta wyżej a treść rośnie.
  const [showJumpDown, setShowJumpDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Czy przewijać automatycznie na dół. Fałsz gdy user sam przewinął w górę,
  // żeby streaming odpowiedzi nie wyrywał go z czytania.
  const stickToBottomRef = useRef(true);
  // Ostatnia pozycja scrolla — odróżnia gest użytkownika (scroll W GÓRĘ) od
  // programowego scrollTo w dół (smooth scroll odpala onScroll na każdej klatce).
  const lastScrollTopRef = useRef(0);
  // Abort streamu + strażnik montażu.
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (stickToBottomRef.current && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Na starcie: od razu na dole (bez animacji przy wejściu w historię).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrolledUp = el.scrollTop < lastScrollTopRef.current - 2;
    lastScrollTopRef.current = el.scrollTop;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (scrolledUp) {
      stickToBottomRef.current = false;
    } else if (distanceFromBottom < 80) {
      stickToBottomRef.current = true;
    }
    setShowJumpDown(!stickToBottomRef.current && distanceFromBottom > 160);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = true;
    setShowJumpDown(false);
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  // Auto-grow textarea (max ~5 linii)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
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
    stickToBottomRef.current = true;
    setShowJumpDown(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          conversationId: conversationId ?? undefined,
          message: text,
        }),
        signal: controller.signal,
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

      // eslint-disable-next-line no-constant-condition
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
      if (controller.signal.aborted || !mountedRef.current) return;
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
      if (abortRef.current === controller) abortRef.current = null;
      if (mountedRef.current) setSending(false);
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

  const streaming = messages.some((m) => m.streaming);

  return (
    // STAŁA wysokość od rodzica (flex-1) — karta NIE rośnie z treścią.
    // min-h chroni czat na bardzo małych ekranach (wtedy scrolluje strona).
    <div className="relative flex-1 min-h-[340px] rounded-lg bg-card border border-border shadow-card flex flex-col overflow-hidden">
      <NdviKeyline height={3} rounded={false} />

      {/* Header — kompaktowy na mobile */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-border bg-secondary shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <AgentAvatar size={36} active={streaming} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-display font-semibold tracking-tight text-foreground text-sm sm:text-base">
                AgroAgent
              </div>
              <span className="inline-flex items-center gap-1.5 border border-border bg-card px-1.5 py-0.5 rounded-md">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    streaming ? 'bg-signal-heat animate-pulse' : 'bg-signal-healthy',
                  )}
                />
                <span className="hud-label">{streaming ? 'Analizuje…' : 'Online'}</span>
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
              Cyfrowy agronom · satelita · pogoda · rejestr ŚOR
            </div>
          </div>
        </div>
      </div>

      {/* Messages — JEDYNE miejsce ze scrollem. Karta wypełnia panel, ale sama
          rozmowa trzyma się czytelnej, wyśrodkowanej kolumny (jak w ChatGPT),
          żeby na szerokim ekranie tekst nie rozlewał się na całą szerokość. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 sm:py-5"
      >
        <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-4">
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
      </div>

      {/* „Do dołu" — gdy user czyta wyżej, a rozmowa idzie dalej */}
      <AnimatePresence>
        {showJumpDown && (
          <motion.button
            type="button"
            onClick={jumpToBottom}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-3 sm:right-5 bottom-[88px] sm:bottom-24 z-10 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background text-xs font-medium pl-2.5 pr-3 py-1.5 shadow-card hover:brightness-110 transition"
            aria-label="Przewiń do najnowszej wiadomości"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Najnowsze
          </motion.button>
        )}
      </AnimatePresence>

      {/* Composer — safe-area na telefonach z notchem; wyrównany do kolumny rozmowy */}
      <div className="border-t border-border bg-secondary shrink-0 p-2.5 sm:p-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2 rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring transition p-1.5 sm:p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Zapytaj o swoje pola…"
            // text-base na mobile — poniżej 16px iOS zoomuje stronę przy focusie
            className="flex-1 resize-none px-2 py-1.5 bg-transparent focus:outline-none text-base sm:text-sm placeholder:text-muted-foreground max-h-[140px]"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            aria-label="Wyślij wiadomość"
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md h-10 w-10 sm:w-auto sm:px-3 text-sm font-medium transition shrink-0',
              sending || !input.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:brightness-110',
            )}
          >
            <Send className={cn('w-4 h-4', sending && 'animate-pulse')} />
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </div>
        <p className="mt-1.5 hud-label px-1 hidden sm:block">
          Enter — wyślij · Shift+Enter — nowa linia
        </p>
      </div>
    </div>
  );
}

function EmptyChatTip({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AgentAvatar size={64} />
      </motion.div>
      <div className="mt-5 max-w-sm">
        <div className="hud-label mb-1.5">Agronom AI · gotowy</div>
        <div className="font-display text-lg font-semibold text-foreground tracking-tight">
          Agent zna Twoje pola
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Zapytaj po polsku, jak rozmawiasz z sąsiadem. Zalecenia wspierają Twoją
          decyzję — środki zawsze weryfikuje w rejestrze MRiRW.
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

  if (isUser) {
    // User bez avatara — czyściej, więcej miejsca na mobile.
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] sm:max-w-[75%] px-3.5 sm:px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-2xl rounded-br-md whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 sm:gap-3 items-start group">
      <AgentAvatar size={30} active={Boolean(message.streaming)} className="mt-0.5" />
      <div className="max-w-[88%] sm:max-w-[80%] min-w-0">
        <div className="px-3.5 sm:px-4 py-2.5 text-sm leading-relaxed bg-card border border-border text-foreground rounded-2xl rounded-tl-md shadow-card">
          {!message.content && message.streaming ? (
            <TypingDots />
          ) : (
            <div className="space-y-1.5">
              <SimpleMarkdown text={message.content} />
              {message.streaming && (
                <span className="inline-block w-1.5 h-3 align-baseline bg-signal-healthy ml-0.5 animate-pulse" />
              )}
            </div>
          )}
        </div>
        {!message.streaming && message.content && (
          <CopyButton text={message.content} />
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Nie udało się skopiować.');
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="mt-1 inline-flex items-center gap-1 hud-label opacity-0 group-hover:opacity-100 focus:opacity-100 transition hover:text-foreground"
      aria-label="Kopiuj odpowiedź"
    >
      {copied ? <Check className="w-3 h-3 text-signal-healthy" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Skopiowano' : 'Kopiuj'}
    </button>
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
