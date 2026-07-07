// Wybór silnika czatu AI — decyzja rolnika per gospodarstwo (Farm.chatEngine).
// Domyślnie (brak preferencji lub odziedziczone "auto") działa wbudowany AgroAgent v2
// (MiniMax) — OpenClaw wyłącznie przy jawnym wyborze, nawet gdy jest wdrożony.
// Jedno źródło prawdy dla /api/chat/stream, webhooka WhatsApp i strony agenta.

export type ChatEnginePreference = 'auto' | 'agroagent' | 'openclaw';
export type ResolvedChatEngine = 'agroagent' | 'openclaw' | 'openclaw_unavailable';

export const CHAT_ENGINE_VALUES: ChatEnginePreference[] = ['auto', 'agroagent', 'openclaw'];

export function isChatEnginePreference(v: unknown): v is ChatEnginePreference {
  return typeof v === 'string' && (CHAT_ENGINE_VALUES as string[]).includes(v);
}

/**
 * Rozstrzyga, który silnik obsłuży rozmowę.
 * `openclaw_unavailable` = rolnik wybrał OpenClaw, ale agent nie jest wdrożony/READY —
 * wołający pokazuje CTA wdrożenia albo podpowiedź zmiany silnika (NIE cichy fallback:
 * skoro user wybrał jawnie, nie podmieniamy mu silnika po cichu).
 */
export function resolveChatEngine(
  preference: string | null | undefined,
  hasReadyOpenclawAgent: boolean,
): ResolvedChatEngine {
  const pref: ChatEnginePreference = isChatEnginePreference(preference) ? preference : 'auto';
  if (pref === 'openclaw') return hasReadyOpenclawAgent ? 'openclaw' : 'openclaw_unavailable';
  // 'agroagent' oraz 'auto' (legacy default w DB) → wbudowany MiniMax.
  return 'agroagent';
}
