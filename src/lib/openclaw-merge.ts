/**
 * F2-light: chat.history merge for missing assistant turns.
 *
 * Why this exists:
 *   `runAgentStream` resolves on the FIRST `chat:final` event and closes the WS.
 *   But the OpenClaw main agent often emits MULTIPLE `chat:final` events per user
 *   request (one per intermediate turn — e.g. "spawning subagents…", then later
 *   "subagent 1 returned…", then a final wrap-up). Everything after the first
 *   final lives only in the gateway transcript and never reaches our DB / UI.
 *
 * Strategy: ask the gateway for the full transcript via `chat.history`, diff it
 * against what we already have in the DB, and persist + emit the missing
 * assistant turns. Run this BEFORE the agent (catches messages that flushed
 * after the previous POST closed) and AFTER the agent (catches messages that
 * flushed during the current run but after our chat:final).
 *
 * Reference: openclaw-office/src/store/console-stores/chat-dock-store.ts
 *   On empty `chat:final` it calls `loadHistory()` which re-fetches via
 *   `chat.history` and rebuilds the message list. Same idea, different surface.
 */

import type { PrismaClient } from "@prisma/client";
import {
  OpenClawClient,
  extractContentParts,
  sessionKeyFor,
  type ExtractedToolCall,
} from "./openclaw";

// Re-export so existing callers can keep importing from this module.
export type { ExtractedToolCall };

interface OpenClawTransportMessage {
  role?: string;
  content?: unknown;
  timestamp?: number;
  toolName?: string;
  toolCallId?: string;
  __openclaw?: { id?: string; seq?: number };
}

interface ChatHistoryResponse {
  sessionKey?: string;
  sessionId?: string;
  messages?: OpenClawTransportMessage[];
  thinkingLevel?: string;
}

interface ContentBlockLike {
  type?: string;
  name?: string;
  text?: string;
  id?: string;
  arguments?: unknown;
}

/**
 * Pull `toolCall` blocks out of an assistant message's content array. Returns
 * an empty array for string content or messages without tool blocks.
 *
 * Default `state: "running"`. The caller flips it to `"done"` once the matching
 * `toolResult` has been found in the same transcript.
 */
function extractToolCalls(content: unknown): ExtractedToolCall[] {
  if (!Array.isArray(content)) return [];
  const blocks = content as ContentBlockLike[];
  const calls: ExtractedToolCall[] = [];
  for (const b of blocks) {
    if (b?.type === "toolCall" && typeof b.name === "string") {
      calls.push({
        id: typeof b.id === "string" ? b.id : undefined,
        name: b.name,
        arguments: b.arguments,
        state: "running",
      });
    }
  }
  return calls;
}

/**
 * Walk the full transcript and build a map of toolCallId → result text. Used
 * to enrich the toolCalls we extract from assistant turns with their matching
 * results from later `toolResult` role messages.
 */
function buildToolResultMap(messages: OpenClawTransportMessage[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of messages) {
    if (m.role !== "toolResult") continue;
    const id = m.toolCallId;
    if (typeof id !== "string" || !id) continue;
    if (Array.isArray(m.content)) {
      const blocks = m.content as ContentBlockLike[];
      const text = blocks
        .filter((b) => b?.type === "text" && typeof b.text === "string")
        .map((b) => b.text!)
        .join("");
      if (text) map.set(id, text);
    } else if (typeof m.content === "string") {
      map.set(id, m.content);
    }
  }
  return map;
}

/**
 * Detect whether the recent transcript contains sessions_spawn activity that
 * may still be in flight. Used as a trigger to keep polling chat.history after
 * the main `chat:final` — if the agent spawned subagents in its last turn,
 * their replies will arrive as new assistant turns 10–60s later, and we want
 * to surface them automatically instead of forcing the user to type "i jak tam?".
 *
 * Heuristic: any sessions_spawn in toolCall or toolResult form within the last
 * `lookback` messages → assume something might still be coming. We don't try
 * to track exact spawn-vs-completion counts because it's brittle (the subagent
 * completion can arrive as either a `user` role or an `assistant` role
 * depending on framework version, and the toolResult schema varies).
 */
export function hasRecentSubagentActivity(
  messages: OpenClawTransportMessage[] | undefined,
  lookback = 30,
): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const recent = messages.slice(-lookback);
  for (const m of recent) {
    if (m.toolName === "sessions_spawn") return true;
    if (Array.isArray(m.content)) {
      const blocks = m.content as ContentBlockLike[];
      for (const b of blocks) {
        if (b?.type === "toolCall" && b?.name === "sessions_spawn") return true;
      }
    }
  }
  return false;
}

export interface InjectedMessage {
  /** New DB Message.id (uuid) */
  id: string;
  /** Plain text content (no thinking blocks). Empty string for pure tool-call turns. */
  content: string;
  /** ISO timestamp from the gateway, used for chronological ordering in the UI */
  createdAt: string;
  /** Stable openclaw id, useful for client-side dedup if needed */
  openclawId?: string;
  /** Monotonic sequence within the session — used for ordering and dedup */
  openclawSeq?: number;
  /** Tool calls extracted from this turn (web_search, sessions_spawn, etc.) — UI renders as collapsible cards */
  toolCalls?: ExtractedToolCall[];
}

/**
 * Build the dedup key set from existing DB messages for a conversation.
 *
 * - Tier 1: explicit `openclawId` stored in metadata (forward-only, perfect dedup)
 * - Tier 2: content-hash fallback for text-bearing messages persisted before
 *   this fix shipped
 * - Tier 3 (NEW): toolCall id set, so we don't double-insert pure tool-call
 *   turns (which have empty content, can't use Tier 2)
 *
 * Returns all three lookups so the caller can skip any gateway message that matches.
 */
function buildSeenSets(
  existing: Array<{ content: string; metadata: string | null }>,
): { seenIds: Set<string>; seenContent: Set<string>; seenToolCallIds: Set<string> } {
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const seenToolCallIds = new Set<string>();
  for (const m of existing) {
    if (m.content && m.content.trim()) seenContent.add(m.content.trim());
    if (!m.metadata) continue;
    try {
      const meta = JSON.parse(m.metadata) as Record<string, unknown>;
      const oid = meta.openclawId;
      if (typeof oid === "string" && oid) seenIds.add(oid);
      const tools = meta.toolCalls;
      if (Array.isArray(tools)) {
        for (const t of tools) {
          const tid = (t as Record<string, unknown>)?.id;
          if (typeof tid === "string" && tid) seenToolCallIds.add(tid);
        }
      }
    } catch {
      // ignore malformed metadata
    }
  }
  return { seenIds, seenContent, seenToolCallIds };
}

export interface MergeResult {
  injected: InjectedMessage[];
  /** Raw transcript messages from the gateway, or empty array on error */
  transcript: OpenClawTransportMessage[];
}

/**
 * Fetch the gateway transcript and persist any assistant messages that we
 * don't already have. Returns both the newly-persisted messages and the raw
 * transcript (so the caller can do additional analysis like detecting pending
 * subagent activity without re-fetching).
 *
 * `excludeContent` lets the caller skip a known reply (e.g. the main reply
 * about to be persisted by the route handler) so we don't double-emit it.
 *
 * Best-effort: any failure (gateway down, schema drift, JSON parse error) is
 * swallowed and an empty result is returned. Never breaks the main flow.
 */
export async function mergeMissingAssistantMessages(opts: {
  prisma: PrismaClient;
  client: OpenClawClient;
  agentId: string;
  conversationId: string;
  excludeContent?: string;
}): Promise<MergeResult> {
  const { prisma, client, agentId, conversationId, excludeContent } = opts;

  let history: ChatHistoryResponse;
  try {
    history = (await client.chatHistory(
      sessionKeyFor(conversationId),
    )) as ChatHistoryResponse;
  } catch (err) {
    console.error("[merge] chat.history failed:", err);
    return { injected: [], transcript: [] };
  }

  const messages = Array.isArray(history.messages) ? history.messages : [];
  if (messages.length === 0) return { injected: [], transcript: [] };

  const existing = await prisma.message.findMany({
    where: {
      conversationId,
      role: "ASSISTANT",
    },
    select: { content: true, metadata: true },
  });
  const { seenIds, seenContent, seenToolCallIds } = buildSeenSets(existing);

  // Pre-build the toolCallId → result text map so we can attach results to
  // the toolCalls we extract from each assistant turn in one pass.
  const resultMap = buildToolResultMap(messages);

  const excludeNorm = excludeContent?.trim() ?? "";
  const injected: InjectedMessage[] = [];

  for (const m of messages) {
    if (m.role !== "assistant") continue;

    const oc = m.__openclaw ?? {};
    const openclawId = typeof oc.id === "string" ? oc.id : undefined;
    const openclawSeq = typeof oc.seq === "number" ? oc.seq : undefined;

    // Tier 1 dedup: openclawId
    if (openclawId && seenIds.has(openclawId)) continue;

    // Extract text and tool calls from the content blocks. A turn can be:
    //   - text only            → persist as before (most common)
    //   - toolCall only        → persist with empty content + metadata.toolCalls
    //   - text + toolCall      → persist text and attach toolCalls in metadata
    //   - empty (NO_REPLY)     → skip
    const { text } = extractContentParts(m.content);
    const trimmed = text.trim();
    const toolCalls = extractToolCalls(m.content);

    // Enrich each toolCall with its matching result text (if any). If we find
    // a result, flip state from "running" to "done" so the UI shows ✓ instead
    // of bouncing dots on refresh.
    if (toolCalls.length > 0) {
      for (const t of toolCalls) {
        if (t.id && resultMap.has(t.id)) {
          t.result = resultMap.get(t.id);
          t.state = "done";
        }
      }
    }

    // Skip turns with no text AND no tool calls — pure NO_REPLY noise.
    if (!trimmed && toolCalls.length === 0) continue;

    // Skip the main reply we're about to persist (caller's responsibility).
    // Only applies to text turns; tool-only turns can never collide with
    // excludeContent because that's always the assistant's text reply.
    if (trimmed && excludeNorm && trimmed === excludeNorm) continue;

    // Tier 2 dedup: content hash (only for text turns — empty strings would
    // collide).
    if (trimmed && seenContent.has(trimmed)) continue;

    // Tier 3 dedup: tool-only turns dedup by toolCall ids. If every toolCall
    // in this turn already exists in DB, skip the whole turn.
    if (!trimmed && toolCalls.length > 0) {
      const allSeen = toolCalls.every((t) => t.id && seenToolCallIds.has(t.id));
      if (allSeen) continue;
    }

    const ts = typeof m.timestamp === "number" ? new Date(m.timestamp) : new Date();

    try {
      const created = await prisma.message.create({
        data: {
          agentId,
          conversationId,
          role: "ASSISTANT",
          content: text,
          createdAt: ts,
          metadata: JSON.stringify({
            openclawId,
            openclawSeq,
            injected: true,
            ...(toolCalls.length > 0 ? { toolCalls } : {}),
          }),
        },
      });
      injected.push({
        id: created.id,
        content: text,
        createdAt: ts.toISOString(),
        openclawId,
        openclawSeq,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      });
      // Update seen sets so we don't double-insert within the same call
      if (openclawId) seenIds.add(openclawId);
      if (trimmed) seenContent.add(trimmed);
      for (const t of toolCalls) {
        if (t.id) seenToolCallIds.add(t.id);
      }
    } catch (err) {
      console.error("[merge] failed to persist injected message:", err);
    }
  }

  return { injected, transcript: messages };
}

/**
 * Background polling: keep calling chat.history at a steady interval to catch
 * late-arriving assistant turns (the typical case: user asks for subagents,
 * main agent says "Wysłane!", `chat:final` fires, WS closes — then 30s later
 * subagents start returning and the main agent emits new turns that we'd
 * otherwise never see until the user manually types "i jak tam?").
 *
 * Idle reset rules (any of these counts as "still active", reset lastNewAt):
 *   1. We injected new assistant messages this iteration (text turns + tool-only turns)
 *   2. The transcript LENGTH grew vs last iteration — catches the case where
 *      the gateway is processing tool calls / receiving toolResults but the
 *      main agent hasn't emitted a new text turn yet (those new transcript
 *      entries are toolResults / internal context messages we don't inject,
 *      but they still mean activity is happening)
 *
 * Stops on any of:
 *   - `idleTimeoutMs` elapsed without any of the activity signals above (default 30s)
 *   - `hardTimeoutMs` elapsed total (safety cap to bound function cost, default 8min)
 *   - `isCancelled()` returns true (user navigated away, controller closed)
 *
 * The old `hasRecentSubagentActivity` reset rule was removed: it returned true
 * whenever any sessions_spawn appeared in the last ~30 transcript messages,
 * which meant polling ran to the hard-cap 8 minutes for any conversation that
 * ever used subagents — even long after they'd all returned. Transcript growth
 * (rule 2) already catches in-flight subagents because toolResults land as new
 * transcript entries as they return, so rule 3 was redundant.
 *
 * Idle timeout lowered from 90s → 30s to close the stream (and therefore the
 * client's gold "still working" indicator) within ~30s of the last actual
 * activity, instead of 60s+ of dead polling. Real-world subagents return in
 * 28-90s bursts with gaps < 30s between them, so this still catches them.
 *
 * Each batch of newly-merged messages is delivered via `onBatch` so the route
 * can emit them as SSE events in real time.
 */
export async function pollForLateAssistantMessages(opts: {
  prisma: PrismaClient;
  client: OpenClawClient;
  agentId: string;
  conversationId: string;
  excludeContent?: string;
  intervalMs?: number;
  idleTimeoutMs?: number;
  hardTimeoutMs?: number;
  isCancelled: () => boolean;
  onBatch: (messages: InjectedMessage[]) => void;
}): Promise<void> {
  const intervalMs = opts.intervalMs ?? 3_000;
  const idleTimeoutMs = opts.idleTimeoutMs ?? 30_000;
  const hardTimeoutMs = opts.hardTimeoutMs ?? 8 * 60_000;

  const start = Date.now();
  let lastNewAt = Date.now();
  let lastTranscriptLen = 0;

  while (true) {
    if (opts.isCancelled()) return;
    if (Date.now() - start > hardTimeoutMs) return;
    if (Date.now() - lastNewAt > idleTimeoutMs) return;

    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    if (opts.isCancelled()) return;

    try {
      const result = await mergeMissingAssistantMessages({
        prisma: opts.prisma,
        client: opts.client,
        agentId: opts.agentId,
        conversationId: opts.conversationId,
        excludeContent: opts.excludeContent,
      });
      const transcriptLen = result.transcript.length;
      const grew = transcriptLen > lastTranscriptLen;
      lastTranscriptLen = transcriptLen;

      if (result.injected.length > 0) {
        opts.onBatch(result.injected);
      }
      // Reset idle when anything concretely moved: either we injected new
      // assistant turns, or the raw transcript grew (toolResults / context
      // messages we don't inject but still imply activity). We deliberately
      // do NOT reset just because a sessions_spawn exists in history — that
      // caused polling to run to the 8-min hard cap on any subagent convo.
      if (result.injected.length > 0 || grew) {
        lastNewAt = Date.now();
      }
    } catch (err) {
      console.error("[poll] iteration failed:", err);
      // Don't break — try again next interval
    }
  }
}
