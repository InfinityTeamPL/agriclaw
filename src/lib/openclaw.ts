import WebSocket from "ws";
import { randomUUID } from "crypto";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RunResult {
  success: boolean;
  output?: string;
  thinking?: string;
  images?: ImageBlock[];
  error?: string;
  duration?: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  model?: string;
  /** True when the run completed but produced empty content (interrupted/aborted before any text). */
  interrupted?: boolean;
}

/**
 * Tool call extracted from an assistant turn's content blocks. Same shape as
 * the legacy `openclaw-merge.ExtractedToolCall` (kept compatible) — moved here
 * so the live streaming path can emit them turn-by-turn without depending on
 * the merge module.
 */
export interface ExtractedToolCall {
  /** Stable id from the gateway, e.g. "call_function_xxx_1". Matches the toolResult.toolCallId. */
  id?: string;
  /** Tool name, e.g. "web_search", "sessions_spawn", "browser" */
  name: string;
  /** Raw arguments object — UI renders any tool */
  arguments?: unknown;
  /** Plain text result from the matching toolResult message. Optional — may not exist for in-flight calls. */
  result?: string;
  /** Lifecycle: "running" before result arrives, "done" once result is matched. UI shows a status dot. */
  state?: "running" | "done" | "error";
}

/**
 * Snapshot of a single assistant turn as the gateway streams it. The same
 * `openclawId` will be emitted MULTIPLE times as content grows — every emit
 * carries the latest full snapshot, so the consumer just upserts by id.
 *
 * Why a snapshot and not a delta? Because OpenClaw's `session.message` events
 * already arrive as snapshots — `msg.content` is the full content array as it
 * exists at that moment, not just the new piece. Trying to compute deltas on
 * top of that would just add complexity without changing the wire shape.
 */
export interface AssistantTurnSnapshot {
  /** Stable openclaw turn id (`__openclaw.id`). Used as the upsert key. */
  openclawId?: string;
  /** Monotonic seq within the session — useful for tie-breaking same-second timestamps. */
  openclawSeq?: number;
  /** Latest text snapshot — overwrites whatever the consumer had before. */
  text: string;
  /** Latest thinking snapshot. */
  thinking?: string;
  /** Latest image set. */
  images?: ImageBlock[];
  /** Latest toolCall set extracted from content blocks. */
  toolCalls?: ExtractedToolCall[];
  /** Gateway timestamp (epoch ms) — drives chronological ordering in the UI. */
  timestamp: number;
}

/**
 * Result text for a previously-emitted tool call. The gateway sends these as
 * separate `session.message` events with `role: "toolResult"` and a
 * `toolCallId` that matches one of the toolCall ids from a prior assistant
 * turn. Consumer is expected to find the matching toolCall and attach the
 * result + flip its state to "done".
 */
export interface ToolResultEvent {
  toolCallId: string;
  result: string;
  timestamp: number;
}

interface HealthStatus {
  ok: boolean;
  uptime?: string;
  version?: string;
}

// Gateway WebSocket protocol types
interface GatewayResponseOk {
  type: "res";
  id: string;
  ok: true;
  payload: Record<string, unknown>;
}

interface GatewayResponseError {
  type: "res";
  id: string;
  ok: false;
  error: { code: string; message: string };
}

type GatewayResponse = GatewayResponseOk | GatewayResponseError;

interface GatewayEvent {
  type: "event";
  event: string;
  payload: Record<string, unknown>;
}

type GatewayFrame = GatewayResponse | GatewayEvent;

// Content can be a string or Anthropic-style content blocks array
interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  // Image blocks (from image_generate tool or media attachments)
  source?: { type: string; media_type?: string; data?: string; url?: string };
  url?: string;
  image_url?: string;
  // Tool call blocks (type: "toolCall") — gateway sends these inline with text
  // blocks inside an assistant message's content array. We extract them so
  // they can be rendered as collapsible cards in chronological position.
  id?: string;
  name?: string;
  arguments?: unknown;
}

export interface ImageBlock {
  /** data:image/png;base64,... or https://... URL */
  url: string;
}

const CONNECT_TIMEOUT_MS = 10_000;
// 13 min — must stay under Vercel maxDuration (800s) so the client returns
// a clean error before Vercel kills the function. See app/api/chat/[agentId]/stream/route.ts.
const CHAT_TIMEOUT_MS = 795_000;
const DEFAULT_SESSION_KEY = "agent:main:main";

export function sessionKeyFor(conversationId?: string): string {
  if (!conversationId) return DEFAULT_SESSION_KEY;
  return `agent:main:clawlabs:direct:${conversationId}`;
}

/**
 * Extract plain text and thinking from OpenClaw message content.
 * Content can be a plain string or an array of Anthropic-style content blocks.
 */
function extractTextFromContent(content: unknown): string {
  return extractContentParts(content).text;
}

export function extractContentParts(content: unknown): {
  text: string;
  thinking: string;
  images: ImageBlock[];
  toolCalls: ExtractedToolCall[];
} {
  let text = "";
  let thinking = "";
  const images: ImageBlock[] = [];
  const toolCalls: ExtractedToolCall[] = [];

  if (typeof content === "string") {
    // Extract <thinking>...</thinking> blocks before stripping
    const thinkMatches = content.match(/<thinking>([\s\S]*?)<\/thinking>/g);
    if (thinkMatches) {
      thinking = thinkMatches
        .map((m) => m.replace(/<\/?thinking>/g, "").trim())
        .join("\n");
    }
    text = content.replace(/<\/?(?:final|thinking|artifact)>/g, "").replace(/\{\{[^}]*\}\}/g, "").trim();
  } else if (Array.isArray(content)) {
    const blocks = content as ContentBlock[];
    text = blocks
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text!)
      .join("");
    thinking = blocks
      .filter((b) => b.type === "thinking" && b.thinking)
      .map((b) => b.thinking!)
      .join("\n");

    // Extract image blocks
    for (const b of blocks) {
      if (b.type === "image") {
        if (b.source?.type === "base64" && b.source.data) {
          images.push({ url: `data:${b.source.media_type || "image/png"};base64,${b.source.data}` });
        } else if (b.source?.type === "url" && b.source.url) {
          images.push({ url: b.source.url });
        } else if (b.url) {
          images.push({ url: b.url });
        } else if (b.image_url) {
          images.push({ url: b.image_url });
        }
      }
    }

    // Extract tool call blocks (type: "toolCall"). The gateway interleaves
    // these with text blocks inside an assistant message's content array —
    // they used to be silently dropped here, which is why "live" tool cards
    // never showed up and the UI had to wait for a chat.history poll.
    for (const b of blocks) {
      if (b.type === "toolCall" && typeof b.name === "string") {
        toolCalls.push({
          id: typeof b.id === "string" ? b.id : undefined,
          name: b.name,
          arguments: b.arguments,
          state: "running",
        });
      }
    }

    // Also strip wrapper tags and gateway template tags from text
    text = text.replace(/<\/?(?:final|thinking|artifact)>/g, "").replace(/\{\{[^}]*\}\}/g, "").trim();
  }

  return { text, thinking, images, toolCalls };
}

/**
 * Pull the plain text out of a `role: "toolResult"` message's content array.
 * Mirrors `buildToolResultMap` from openclaw-merge.ts but for one message at a
 * time, used by the live streaming path.
 */
export function extractToolResultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const blocks = content as ContentBlock[];
  return blocks
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text!)
    .join("");
}

/**
 * Parse a base64 data URL into an attachment object for chat.send.
 * Returns undefined if the image is not a valid data URL.
 */
function parseImageAttachment(image?: string) {
  if (!image) return undefined;
  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return undefined;
  const [, mediaType, data] = match;
  return [{ type: "image", source: { type: "base64", media_type: mediaType, data } }];
}

export class OpenClawClient {
  private serverIp: string;
  private port: number;
  private token: string;

  constructor(serverIp: string, port: number = 18789, token: string = "") {
    this.serverIp = serverIp;
    this.port = port;
    this.token = token;
  }

  /** Health check still uses HTTP — works without scopes */
  async healthCheck(): Promise<HealthStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`http://${this.serverIp}:${this.port}/healthz`, {
        signal: controller.signal,
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      clearTimeout(timeout);

      if (!response.ok) return { ok: false };

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return { ok: true, uptime: String(data.uptime || ""), version: String(data.version || "") };
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  async getStatus(): Promise<HealthStatus> {
    return this.healthCheck();
  }

  /**
   * Open WebSocket, perform challenge/connect handshake as openclaw-control-ui.
   * Must use this client ID + Origin to get operator.admin scopes.
   */
  private connectWs(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        ws.terminate();
        reject(new Error("WebSocket connect timeout"));
      }, CONNECT_TIMEOUT_MS);

      const ws = new WebSocket(`ws://${this.serverIp}:${this.port}`, {
        headers: { Origin: "https://clawlabs.pro" },
        perMessageDeflate: false,
        handshakeTimeout: 10000,
      });

      ws.on("error", (err) => {
        clearTimeout(timer);
        reject(new Error(`WebSocket error: ${err.message}`));
      });

      ws.on("close", () => {
        clearTimeout(timer);
        reject(new Error("WebSocket closed during handshake"));
      });

      ws.on("message", (data) => {
        let frame: GatewayFrame;
        try {
          frame = JSON.parse(data.toString()) as GatewayFrame;
        } catch {
          return;
        }

        // Step 1: Wait for connect.challenge
        if (frame.type === "event" && (frame as GatewayEvent).event === "connect.challenge") {
          // Step 2: Send connect as openclaw-control-ui with scopes
          ws.send(JSON.stringify({
            type: "req",
            id: randomUUID(),
            method: "connect",
            params: {
              minProtocol: 1,
              maxProtocol: 3,
              client: {
                id: "openclaw-control-ui",
                version: "0.1.0",
                platform: "web",
                mode: "ui",
              },
              caps: ["tool-events"],
              scopes: ["operator.admin"],
              ...(this.token ? { auth: { token: this.token } } : {}),
            },
          }));
          return;
        }

        // Step 3: Wait for hello-ok
        if (frame.type === "res") {
          clearTimeout(timer);
          const res = frame as GatewayResponse;
          if (res.ok && (res.payload as Record<string, unknown>)?.type === "hello-ok") {
            ws.removeAllListeners("message");
            ws.removeAllListeners("error");
            ws.removeAllListeners("close");
            resolve(ws);
          } else if (!res.ok) {
            ws.terminate();
            reject(new Error(`Gateway connect failed: ${(res as GatewayResponseError).error.message}`));
          }
        }
      });
    });
  }

  /**
   * Send an RPC request and wait for its response by matching request ID.
   */
  private rpcRequest(
    ws: WebSocket,
    method: string,
    params: Record<string, unknown>,
    timeoutMs = 10_000,
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const timer = setTimeout(() => {
        reject(new Error(`RPC timeout: ${method}`));
      }, timeoutMs);

      const handler = (data: WebSocket.Data) => {
        let frame: GatewayFrame;
        try {
          frame = JSON.parse(data.toString()) as GatewayFrame;
        } catch {
          return;
        }

        if (frame.type === "res" && (frame as GatewayResponse).id === id) {
          clearTimeout(timer);
          ws.off("message", handler);
          const res = frame as GatewayResponse;
          if (res.ok) {
            resolve(res.payload);
          } else {
            reject(new Error(`RPC error (${method}): ${(res as GatewayResponseError).error.message}`));
          }
        }
      };

      ws.on("message", handler);
      ws.send(JSON.stringify({ type: "req", id, method, params }));
    });
  }

  /**
   * Delete a session on the OpenClaw gateway. Used to keep gateway state in sync
   * with our DB when the user deletes a conversation in webchat.
   *
   * Schema (from openclaw/openclaw src/gateway/protocol/schema/sessions.ts):
   *   sessions.delete { key: NonEmptyString, deleteTranscript?: boolean, emitLifecycleHooks?: boolean }
   *
   * Best-effort: caller should wrap in try/catch and treat failure as non-fatal.
   */
  async deleteSession(sessionKey: string, opts: { deleteTranscript?: boolean } = {}): Promise<Record<string, unknown>> {
    const ws = await this.connectWs();
    try {
      return await this.rpcRequest(ws, "sessions.delete", {
        key: sessionKey,
        deleteTranscript: opts.deleteTranscript ?? true,
      });
    } finally {
      ws.terminate();
    }
  }

  /**
   * List sessions for the connected agent. Returns the raw payload from the gateway.
   * Used by the F4 sidebar sync and by the probe script to identify orphaned sessions.
   */
  async listSessions(): Promise<Record<string, unknown>> {
    const ws = await this.connectWs();
    try {
      return await this.rpcRequest(ws, "sessions.list", {});
    } finally {
      ws.terminate();
    }
  }

  /**
   * Fetch the full transcript of a session from the gateway. Used by F2-light
   * "history-merge": after the main agent finishes its turn, we pull this and
   * compare against our DB to inject any subagent reply messages that arrived
   * out-of-band (between POSTs) — those messages are present in the gateway
   * transcript and visible to the main agent's chat.history, but our webchat
   * never received them because runAgentStream had already closed the WS.
   *
   * Schema is best-effort: tries `chat.history` first (verified in prior session
   * to return partial assistant content from running/aborted runs), falls back
   * to `sessions.messages.history` if not found.
   */
  async chatHistory(sessionKey: string): Promise<Record<string, unknown>> {
    const ws = await this.connectWs();
    try {
      try {
        return await this.rpcRequest(ws, "chat.history", { sessionKey });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Try fallback method names if the first one isn't recognized
        if (
          msg.includes("not found") ||
          msg.includes("unknown method") ||
          msg.includes("unknown_method") ||
          msg.includes("invalid method") ||
          msg.includes("unsupported")
        ) {
          return await this.rpcRequest(ws, "sessions.messages.history", { key: sessionKey });
        }
        throw err;
      }
    } finally {
      ws.terminate();
    }
  }

  /**
   * Non-streaming chat: send message, collect full response, close connection.
   */
  async runAgent(
    input: string,
    _history: ChatMessage[] = [],
    conversationId?: string,
    image?: string,
  ): Promise<RunResult> {
    const startTime = Date.now();
    const sessionKey = sessionKeyFor(conversationId);

    try {
      const ws = await this.connectWs();

      try {
        // chat.send creates session on demand + sends message
        const sendParams: Record<string, unknown> = {
          sessionKey,
          message: input,
          idempotencyKey: randomUUID(),
        };
        const attachments = parseImageAttachment(image);
        if (attachments) sendParams.attachments = attachments;

        await this.rpcRequest(ws, "chat.send", sendParams);

        // Subscribe to session messages — session now exists after chat.send
        await this.rpcRequest(ws, "sessions.messages.subscribe", { key: sessionKey });

        // Wait for assistant response via session.message + chat final
        const result = await new Promise<{ content: string; usage?: Record<string, unknown>; model?: string }>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error("Chat response timeout"));
          }, CHAT_TIMEOUT_MS);

          let assistantText = "";
          let usage: Record<string, unknown> | undefined;
          let model: string | undefined;

          ws.on("message", (data) => {
            let frame: GatewayFrame;
            try {
              frame = JSON.parse(data.toString()) as GatewayFrame;
            } catch {
              return;
            }

            if (frame.type !== "event") return;
            const evt = frame as GatewayEvent;

            if (evt.event === "session.message") {
              const msg = evt.payload.message as Record<string, unknown> | undefined;
              if (msg?.role === "assistant") {
                assistantText = extractTextFromContent(msg.content);
                usage = msg.usage as Record<string, unknown> | undefined;
                model = (msg.model as string) || (msg.provider as string) || undefined;
              }
            }

            if (evt.event === "chat") {
              const state = String(evt.payload.state || "");
              // Extract usage from chat event if not already captured from session.message
              if (!usage && evt.payload.usage) {
                usage = evt.payload.usage as Record<string, unknown>;
              }
              if (!model && evt.payload.model) {
                model = evt.payload.model as string;
              }
              if (state === "final") {
                clearTimeout(timer);
                resolve({ content: assistantText, usage, model });
              } else if (state === "error") {
                clearTimeout(timer);
                reject(new Error(String(evt.payload.errorMessage || "Agent error")));
              } else if (state === "aborted") {
                clearTimeout(timer);
                resolve({ content: assistantText, usage, model });
              }
            }
          });
        });

        const promptTokens = (result.usage?.input as number) || (result.usage?.prompt_tokens as number) || (result.usage?.promptTokens as number) || 0;
        const completionTokens = (result.usage?.output as number) || (result.usage?.completion_tokens as number) || (result.usage?.completionTokens as number) || 0;

        return {
          success: true,
          output: result.content,
          interrupted: !result.content,
          duration: Date.now() - startTime,
          tokensUsed: promptTokens + completionTokens,
          promptTokens,
          completionTokens,
          model: result.model,
        };
      } finally {
        ws.terminate();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Streaming chat via WebSocket. The "live source of truth" path:
   *
   * For every `session.message` with role=assistant the gateway sends, we
   * extract a full snapshot (text + thinking + images + toolCalls) and forward
   * it via `onTurn`. The same `openclawId` will fire MULTIPLE times as the
   * turn grows — the consumer upserts by id and just keeps the latest snapshot.
   *
   * For every `session.message` with role=toolResult, we emit `onToolResult`
   * with the toolCallId + result text so the consumer can attach the result
   * to a previously-emitted toolCall and flip its state to "done".
   *
   * `onChunk` is kept as a legacy compat callback (text deltas only) so the
   * fallbacks from runAgentStreamHttp still work without modification.
   *
   * Resolves on the first `chat: state=final` event for the main turn — that
   * matches the previous behavior. Subagent replies that arrive 30s+ later
   * are still picked up by `pollForLateAssistantMessages` in the route layer.
   */
  async runAgentStream(
    input: string,
    _history: ChatMessage[] = [],
    conversationId?: string,
    onChunk?: (text: string) => void,
    image?: string,
    onTurn?: (turn: AssistantTurnSnapshot) => void,
    onToolResult?: (event: ToolResultEvent) => void,
  ): Promise<RunResult> {
    const startTime = Date.now();
    const sessionKey = sessionKeyFor(conversationId);

    try {
      const ws = await this.connectWs();

      try {
        // chat.send creates session on demand + sends message
        const sendParams: Record<string, unknown> = {
          sessionKey,
          message: input,
          idempotencyKey: randomUUID(),
        };
        const attachments = parseImageAttachment(image);
        if (attachments) sendParams.attachments = attachments;

        await this.rpcRequest(ws, "chat.send", sendParams);

        // Subscribe to session messages — session now exists after chat.send
        await this.rpcRequest(ws, "sessions.messages.subscribe", { key: sessionKey });

        // Listen for assistant response via session.message + chat final
        const result = await new Promise<{ content: string; thinking: string; images: ImageBlock[]; usage?: Record<string, unknown>; model?: string }>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error("Chat stream timeout"));
          }, CHAT_TIMEOUT_MS);

          // Per-turn delta tracking — keyed by openclawId so each turn has its
          // own running text length (one assistant turn might grow while
          // another stays static). The legacy onChunk callback expects deltas,
          // so we compute them per-id instead of globally.
          const turnTextLen = new Map<string, number>();
          // The "main" turn that drives the resolved RunResult — it's the one
          // that ultimately emits `chat: state=final`. We track it as "the
          // most recent assistant turn we saw" since the gateway doesn't tag
          // session.message events with which turn the chat:final belongs to.
          let lastFullText = "";
          let lastThinking = "";
          let lastImages: ImageBlock[] = [];
          let usage: Record<string, unknown> | undefined;
          let model: string | undefined;

          ws.on("message", (data) => {
            let frame: GatewayFrame;
            try {
              frame = JSON.parse(data.toString()) as GatewayFrame;
            } catch {
              return;
            }

            if (frame.type !== "event") return;
            const evt = frame as GatewayEvent;

            if (evt.event === "session.message") {
              const msg = evt.payload.message as Record<string, unknown> | undefined;
              if (!msg) return;
              const role = String(msg.role || "");

              // Assistant turn — emit a full snapshot (text + toolCalls + …).
              // Same openclawId will fire multiple times as content grows.
              if (role === "assistant") {
                const parts = extractContentParts(msg.content);
                const oc = (msg.__openclaw as { id?: string; seq?: number } | undefined) ?? {};
                const openclawId = typeof oc.id === "string" ? oc.id : undefined;
                const openclawSeq = typeof oc.seq === "number" ? oc.seq : undefined;
                const timestamp =
                  typeof msg.timestamp === "number" ? msg.timestamp : Date.now();

                // Only overwrite lastFullText with non-empty snapshots.
                // The gateway emits multiple assistant messages per run —
                // typically a text turn followed by one or more tool-only
                // turns (e.g. sessions_spawn) which have empty `parts.text`.
                // Naively overwriting drops the real reply and downstream
                // code thinks the run was interrupted, triggering NO_REPLY.
                // Same conditional shape as lastThinking / lastImages below.
                if (parts.text) lastFullText = parts.text;
                if (parts.thinking) lastThinking = parts.thinking;
                if (parts.images.length > 0) lastImages = parts.images;
                usage = msg.usage as Record<string, unknown> | undefined;
                model = (msg.model as string) || (msg.provider as string) || undefined;

                // Legacy onChunk delta — per-turn so two interleaved assistant
                // turns don't blow up the slice math.
                const turnKey = openclawId ?? "__unkeyed__";
                const lastLen = turnTextLen.get(turnKey) ?? 0;
                const newText = parts.text.slice(lastLen);
                turnTextLen.set(turnKey, parts.text.length);
                if (newText && onChunk) {
                  onChunk(newText);
                }

                // Per-turn snapshot — full state, the consumer upserts by id.
                if (onTurn) {
                  onTurn({
                    openclawId,
                    openclawSeq,
                    text: parts.text,
                    thinking: parts.thinking || undefined,
                    images: parts.images.length > 0 ? parts.images : undefined,
                    toolCalls: parts.toolCalls.length > 0 ? parts.toolCalls : undefined,
                    timestamp,
                  });
                }
              }

              // Tool result — match by toolCallId, attach result text to the
              // matching tool card, flip its state to "done".
              if (role === "toolResult") {
                const toolCallId = typeof msg.toolCallId === "string" ? msg.toolCallId : "";
                if (!toolCallId) return;
                const result = extractToolResultText(msg.content);
                const timestamp =
                  typeof msg.timestamp === "number" ? msg.timestamp : Date.now();
                if (onToolResult) {
                  onToolResult({ toolCallId, result, timestamp });
                }
              }
            }

            if (evt.event === "chat") {
              const state = String(evt.payload.state || "");
              if (state === "final") {
                clearTimeout(timer);
                resolve({ content: lastFullText, thinking: lastThinking, images: lastImages, usage, model });
              } else if (state === "error") {
                clearTimeout(timer);
                reject(new Error(String(evt.payload.errorMessage || "Agent error")));
              } else if (state === "aborted") {
                clearTimeout(timer);
                resolve({ content: lastFullText, thinking: lastThinking, images: lastImages, usage, model });
              }
            }
          });

          // Zerwane połączenie z VM w trakcie odpowiedzi. Bez tych handlerów:
          // (1) event 'error' bez listenera → uncaught exception ubija cały proces
          //     serverless (wszystkie równoległe requesty); (2) ciche 'close' →
          //     Promise wisi aż do CHAT_TIMEOUT_MS (rolnik widzi "agent pisze" 13 min).
          // Patrz audyt 2.6.
          ws.on("error", (err) => {
            clearTimeout(timer);
            reject(new Error(`Połączenie z agentem przerwane: ${String(err)}`));
          });
          ws.on("close", () => {
            clearTimeout(timer);
            if (lastFullText) {
              // Mamy częściową/pełną odpowiedź — zwróć ją zamiast błędu.
              resolve({ content: lastFullText, thinking: lastThinking, images: lastImages, usage, model });
            } else {
              reject(new Error("Połączenie z agentem zamknięte przed odpowiedzią"));
            }
          });
        });

        const promptTokens = (result.usage?.input as number) || (result.usage?.prompt_tokens as number) || (result.usage?.promptTokens as number) || 0;
        const completionTokens = (result.usage?.output as number) || (result.usage?.completion_tokens as number) || (result.usage?.completionTokens as number) || 0;

        return {
          success: true,
          output: result.content,
          interrupted: !result.content,
          thinking: result.thinking || undefined,
          images: result.images.length > 0 ? result.images : undefined,
          duration: Date.now() - startTime,
          tokensUsed: promptTokens + completionTokens,
          promptTokens,
          completionTokens,
          model: result.model,
        };
      } finally {
        ws.terminate();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * True token-by-token streaming via HTTP /v1/responses with stream: true.
   * Uses SSE (Server-Sent Events) with response.output_text.delta events.
   * Falls back to WebSocket runAgentStream if the HTTP endpoint is unavailable.
   */
  async runAgentStreamHttp(
    input: string,
    history: ChatMessage[] = [],
    conversationId?: string,
    onChunk?: (text: string) => void,
    image?: string,
  ): Promise<RunResult> {
    const startTime = Date.now();

    try {
      // Build input items from conversation history + current message
      const inputItems: unknown[] = [];

      for (const msg of history) {
        inputItems.push({ role: msg.role, content: msg.content });
      }

      // Current user message (with optional image)
      if (image) {
        const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          inputItems.push({
            role: "user",
            content: [
              { type: "input_image", image_url: image },
              { type: "input_text", text: input },
            ],
          });
        } else {
          inputItems.push({ role: "user", content: input });
        }
      } else {
        inputItems.push({ role: "user", content: input });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

      const response = await fetch(
        `http://${this.serverIp}:${this.port}/v1/responses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          body: JSON.stringify({
            model: "openclaw",
            input: inputItems,
            stream: true,
            user: conversationId || undefined,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        clearTimeout(timeout);
        const errText = await response.text().catch(() => "");
        // If endpoint doesn't exist, fall back to WebSocket streaming
        if (response.status === 404) {
          return this.runAgentStream(input, history, conversationId, onChunk, image);
        }
        return {
          success: false,
          error: `HTTP ${response.status}: ${errText}`,
          duration: Date.now() - startTime,
        };
      }

      const body = response.body;
      if (!body) {
        clearTimeout(timeout);
        return { success: false, error: "No response body", duration: Date.now() - startTime };
      }

      // Parse SSE stream
      let fullText = "";
      let thinkingText = "";
      const collectedImages: ImageBlock[] = [];
      let promptTokens = 0;
      let completionTokens = 0;
      let model: string | undefined;

      const reader = (body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
            continue;
          }

          if (line.trim() === "") {
            currentEventType = "";
            continue;
          }

          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);

            if (currentEventType === "response.output_text.delta" || data.type === "response.output_text.delta") {
              const delta = data.delta || "";
              if (delta) {
                fullText += delta;
                if (onChunk) onChunk(delta);
              }
            }

            if (currentEventType === "response.completed" || data.type === "response.completed") {
              const resp = data.response || data;
              if (resp.usage) {
                promptTokens = resp.usage.input_tokens || resp.usage.prompt_tokens || 0;
                completionTokens = resp.usage.output_tokens || resp.usage.completion_tokens || 0;
              }
              model = resp.model;

              // Extract thinking + images from final output items
              if (resp.output && Array.isArray(resp.output)) {
                for (const item of resp.output) {
                  if (item.content && Array.isArray(item.content)) {
                    const parts = extractContentParts(item.content);
                    if (parts.thinking) thinkingText = parts.thinking;
                    if (parts.images.length > 0) collectedImages.push(...parts.images);
                  }
                }
              }
            }

            if (currentEventType === "response.failed" || data.type === "response.failed") {
              clearTimeout(timeout);
              const errMsg = data.response?.status_details?.error?.message || data.error?.message || "Agent error";
              return {
                success: false,
                error: errMsg,
                duration: Date.now() - startTime,
              };
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      clearTimeout(timeout);

      // Extract thinking blocks from accumulated text if not found in structured output
      if (!thinkingText && fullText) {
        const thinkMatches = fullText.match(/<thinking>([\s\S]*?)<\/thinking>/g);
        if (thinkMatches) {
          thinkingText = thinkMatches
            .map((m) => m.replace(/<\/?thinking>/g, "").trim())
            .join("\n");
          fullText = fullText.replace(/<\/?(?:final|thinking|artifact)>/g, "").trim();
        }
      }

      return {
        success: true,
        output: fullText,
        interrupted: !fullText,
        thinking: thinkingText || undefined,
        images: collectedImages.length > 0 ? collectedImages : undefined,
        duration: Date.now() - startTime,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // Network error or timeout — fall back to WebSocket streaming
      if (message.includes("abort") || message.includes("ECONNREFUSED") || message.includes("fetch")) {
        try {
          return await this.runAgentStream(input, history, conversationId, onChunk, image);
        } catch {
          // fallback also failed
        }
      }
      return {
        success: false,
        error: message,
        duration: Date.now() - startTime,
      };
    }
  }
}

export function createClient(
  serverIp: string,
  port?: number,
  token?: string,
): OpenClawClient {
  return new OpenClawClient(serverIp, port, token);
}
