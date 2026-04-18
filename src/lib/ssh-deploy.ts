import { AI_MODELS } from "@/lib/agent-models";

export function validateModelApiKey(
  modelId: string,
  userKeys?: { anthropic?: string; openai?: string; google?: string }
): { valid: boolean; missingProvider?: string } {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) return { valid: false, missingProvider: "unknown" };

  // Free tier models use platform key — always valid
  if (model.tier === "free") return { valid: true };

  const provider = model.provider.toLowerCase();
  const keyMap: Record<string, { userKey?: string; platformKey?: string }> = {
    anthropic: { userKey: userKeys?.anthropic },
    openai: { userKey: userKeys?.openai },
    google: { userKey: userKeys?.google },
    deepseek: { userKey: userKeys?.openai },
    meta: { userKey: userKeys?.openai },
    minimax: { platformKey: process.env.PLATFORM_MINIMAX_KEY },
  };

  const keys = keyMap[provider];
  if (!keys) return { valid: false, missingProvider: provider };
  if (keys.userKey || keys.platformKey) return { valid: true };
  return { valid: false, missingProvider: model.provider };
}
