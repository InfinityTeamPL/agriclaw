// Klient MiniMax (OpenAI-compatible) dla wbudowanego AgroAgenta v2.
// Zweryfikowane na żywo (07.2026): endpoint https://api.minimax.io/v1/chat/completions,
// model MiniMax-M3, tool-calling w formacie OpenAI, streaming SSE.
//
// UWAGA: M3 to model reasoningowy — w `content` emituje bloki <think>…</think>.
// ThinkFilter usuwa je STANOWO (tag może być rozcięty między chunki streamu).

const DEFAULT_BASE_URL = 'https://api.minimax.io/v1';
export const DEFAULT_AGENT_MODEL = 'MiniMax-M3';

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: LlmToolCall[];
  tool_call_id?: string;
}

export interface LlmToolDef {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ChatResult {
  content: string; // już bez bloków <think>
  toolCalls: LlmToolCall[];
  finishReason: string | null;
}

/**
 * Stanowy filtr bloków <think>…</think> w streamie. Trzyma bufor na wypadek
 * tagu rozciętego między chunki ("<thi" + "nk>"). Zwraca tekst do emisji.
 */
export class ThinkFilter {
  private inThink = false;
  private carry = '';

  push(chunk: string): string {
    let text = this.carry + chunk;
    this.carry = '';
    let out = '';

    while (text.length > 0) {
      if (this.inThink) {
        const close = text.indexOf('</think>');
        if (close === -1) {
          // Może kończyć się początkiem "</think>" — zatrzymaj ogon w carry.
          this.carry = tailPartial(text, '</think>');
          return out;
        }
        text = text.slice(close + '</think>'.length);
        this.inThink = false;
      } else {
        const open = text.indexOf('<think>');
        if (open === -1) {
          const partial = tailPartial(text, '<think>');
          out += text.slice(0, text.length - partial.length);
          this.carry = partial;
          return out;
        }
        out += text.slice(0, open);
        text = text.slice(open + '<think>'.length);
        this.inThink = true;
      }
    }
    return out;
  }

  /** Po zakończeniu streamu: resztka bufora (jeśli nie była tagiem) do emisji. */
  flush(): string {
    if (this.inThink) {
      this.carry = '';
      return '';
    }
    const rest = this.carry;
    this.carry = '';
    return rest;
  }
}

/** Najdłuższy sufiks `text`, który jest prefiksem `token` (potencjalnie rozcięty tag). */
function tailPartial(text: string, token: string): string {
  const max = Math.min(text.length, token.length - 1);
  for (let len = max; len > 0; len--) {
    if (text.endsWith(token.slice(0, len))) return text.slice(text.length - len);
  }
  return '';
}

/** Parsuje jedną linię SSE `data: {...}` — akumuluje content i tool_calls. */
export function accumulateStreamEvent(
  json: {
    choices?: Array<{
      delta?: { content?: string | null; tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }> };
      finish_reason?: string | null;
    }>;
  },
  acc: { toolCalls: LlmToolCall[]; finishReason: string | null },
): string {
  const choice = json.choices?.[0];
  if (!choice) return '';
  if (choice.finish_reason) acc.finishReason = choice.finish_reason;
  const delta = choice.delta;
  if (!delta) return '';
  for (const tc of delta.tool_calls ?? []) {
    const idx = tc.index ?? 0;
    if (!acc.toolCalls[idx]) {
      acc.toolCalls[idx] = { id: tc.id ?? `call_${idx}`, type: 'function', function: { name: '', arguments: '' } };
    }
    const slot = acc.toolCalls[idx];
    if (tc.id) slot.id = tc.id;
    if (tc.function?.name) slot.function.name += tc.function.name;
    if (tc.function?.arguments) slot.function.arguments += tc.function.arguments;
  }
  return typeof delta.content === 'string' ? delta.content : '';
}

export interface ChatStreamOptions {
  messages: LlmMessage[];
  tools?: LlmToolDef[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Delta widocznej treści (po filtrze <think>). */
  onDelta?: (text: string) => void;
  timeoutMs?: number;
}

/**
 * Jedno wywołanie chat completions ze streamingiem. Zwraca pełną treść
 * (bez <think>) i zakumulowane tool_calls.
 */
export async function minimaxChatStream(opts: ChatStreamOptions): Promise<ChatResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY nie jest ustawiony');
  const baseUrl = process.env.MINIMAX_BASE_URL ?? DEFAULT_BASE_URL;
  const model = opts.model ?? process.env.AGENT_MODEL ?? DEFAULT_AGENT_MODEL;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      // Reasoning zjada budżet — bez zapasu M3 utnie odpowiedź (finish=length).
      max_tokens: opts.maxTokens ?? 4000,
      temperature: opts.temperature ?? 0.3,
      messages: opts.messages,
      ...(opts.tools && opts.tools.length > 0 ? { tools: opts.tools } : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '');
    throw new Error(`MiniMax HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const acc = { toolCalls: [] as LlmToolCall[], finishReason: null as string | null };
  const filter = new ThinkFilter();
  let content = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';

  const emit = (raw: string) => {
    const visible = filter.push(raw);
    if (visible) {
      content += visible;
      opts.onDelta?.(visible);
    }
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split('\n');
    sseBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const rawDelta = accumulateStreamEvent(json, acc);
        if (rawDelta) emit(rawDelta);
      } catch {
        /* niepełny/nieparsowalny chunk — pomiń */
      }
    }
  }
  const rest = filter.flush();
  if (rest) {
    content += rest;
    opts.onDelta?.(rest);
  }

  return {
    content: content.trim(),
    toolCalls: acc.toolCalls.filter((t) => t && t.function.name),
    finishReason: acc.finishReason,
  };
}
