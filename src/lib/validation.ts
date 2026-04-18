import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
  name: z.string().max(100).optional(),
});

// Safe characters for values that end up in shell scripts
const safeNameRegex = /^[a-zA-Z0-9 _\-.,!?ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/;
const safeTokenRegex = /^[a-zA-Z0-9:_\-./=+]+$/;

export const deploySchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(50)
    .regex(safeNameRegex, "Nazwa może zawierać tylko litery, cyfry, spacje i podstawowe znaki"),
  model: z.string().min(1, "Model jest wymagany"),
  channel: z.string().min(1, "Kanał jest wymagany"),
  channelToken: z.string().max(200).regex(safeTokenRegex, "Nieprawidłowy format tokena").optional().or(z.literal("")),
  channels: z.array(z.string().max(20)).max(10).optional().default([]),
  channelTokens: z
    .record(z.string().max(200).regex(safeTokenRegex, "Nieprawidłowy format tokena").or(z.literal("")))
    .optional()
    .default({}),
  tagline: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  template: z.string().max(100).nullable().optional(),
  avatarUrl: z.string().url().max(2000).optional().nullable(),
  workspaceFiles: z.record(z.string().max(50000)).optional(),
  automations: z.array(z.unknown()).optional().default([]),
  customScripts: z.array(z.unknown()).optional().default([]),
  apiKeys: z
    .object({
      anthropic: z.string().max(500).optional(),
      openai: z.string().max(500).optional(),
      google: z.string().max(500).optional(),
    })
    .optional(),
});

export const warmPoolDeploySchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(50)
    .regex(safeNameRegex, "Nazwa może zawierać tylko litery, cyfry, spacje i podstawowe znaki"),
  avatarUrl: z.string().url().max(2000).optional().nullable(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Wiadomość nie może być pusta").max(32000),
  image: z.string().max(10_000_000).optional(),
});

export const supportSchema = z.object({
  subject: z.string().min(1, "Temat jest wymagany").max(200),
  category: z.enum(["bug", "feedback", "question", "other"]),
  description: z.string().min(1, "Opis jest wymagany").max(5000),
});

const safeSkillIdRegex = /^[@a-zA-Z0-9/_-]+$/;

export const skillInstallSchema = z.object({
  agentId: z.string().uuid("Nieprawidłowe ID agenta"),
  skillId: z.string().min(1, "ID umiejętności wymagane").max(200).regex(safeSkillIdRegex, "Nieprawidłowy format ID umiejętności"),
  skillName: z.string().max(200).optional(),
});

export const skillUninstallSchema = z.object({
  agentId: z.string().uuid("Nieprawidłowe ID agenta"),
  skillId: z.string().min(1, "ID umiejętności wymagane").max(200).regex(safeSkillIdRegex, "Nieprawidłowy format ID umiejętności"),
});

export const taskSchema = z.object({
  input: z.union([z.string().min(1).max(32000), z.record(z.unknown())]),
  agentId: z.string().uuid().optional(),
});

export const billingSchema = z.object({
  action: z.literal("buy_credits"),
  amount: z.number().positive(),
});

export const subscribeSchema = z.object({
  tier: z.enum(["premium", "pro", "ultra_pro"]),
  promoId: z.string().max(200).optional(),
});

export const contactSchema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  name: z.string().min(1, "Imię jest wymagane").max(100),
  service: z.string().min(1).max(100),
  message: z.string().min(1, "Wiadomość jest wymagana").max(5000),
});

export const deleteAgentSchema = z.object({
  agentId: z.string().uuid("Nieprawidłowe ID agenta"),
});

export const testAgentSchema = z.object({
  message: z.string().min(1).max(32000),
  config: z
    .object({
      name: z.string().max(100).optional(),
      soulMd: z.string().max(50000).optional(),
      identityMd: z.string().max(50000).optional(),
    })
    .optional(),
});

export const keysSchema = z.object({
  anthropicKey: z.string().max(500).optional(),
  openaiKey: z.string().max(500).optional(),
  googleAiKey: z.string().max(500).optional(),
  useOwnKeys: z.boolean().optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKeys: z.object({
    anthropic: z.string().max(500).optional(),
    openai: z.string().max(500).optional(),
    google: z.string().max(500).optional(),
  }).optional(),
});

// Reusable channel schema: { enabled, token/botToken }
const tokenChannelSchema = (field: "botToken" | "token" | "jsonKey" = "token") =>
  z.object({
    enabled: z.boolean(),
    [field]: z.string().max(5000).optional().or(z.literal("")),
    dmPolicy: z.enum(["open", "pairing", "allowlist", "disabled"]).optional(),
  }).optional();

export const agentConfigureSchema = z.object({
  channels: z
    .object({
      telegram: tokenChannelSchema("botToken"),
      discord: tokenChannelSchema("token"),
      whatsapp: z.object({ enabled: z.boolean() }).optional(),
      slack: tokenChannelSchema("botToken"),
      msteams: tokenChannelSchema("botToken"),
      googlechat: tokenChannelSchema("jsonKey"),
      mattermost: tokenChannelSchema("botToken"),
      signal: z.object({ enabled: z.boolean() }).optional(),
      line: tokenChannelSchema("token"),
      imessage: z.object({ enabled: z.boolean() }).optional(),
      matrix: tokenChannelSchema("token"),
      twitch: tokenChannelSchema("token"),
      irc: tokenChannelSchema("token"),
    })
    .optional(),
  integrations: z
    .object({
      // Search providers
      braveSearch: z.object({ enabled: z.boolean(), apiKey: z.string().max(200).optional().or(z.literal("")) }).optional(),
      duckduckgo: z.object({ enabled: z.boolean() }).optional(),
      exa: z.object({ enabled: z.boolean(), apiKey: z.string().max(200).optional().or(z.literal("")) }).optional(),
      tavily: z.object({ enabled: z.boolean(), apiKey: z.string().max(200).optional().or(z.literal("")) }).optional(),
      perplexity: z.object({ enabled: z.boolean(), apiKey: z.string().max(500).optional().or(z.literal("")) }).optional(),
      // Image generation
      imageGenOpenai: z.object({ enabled: z.boolean() }).optional(),
      imageGenGoogle: z.object({ enabled: z.boolean() }).optional(),
      imageGenFal: z.object({ enabled: z.boolean(), apiKey: z.string().max(500).optional().or(z.literal("")) }).optional(),
      imageGenMinimax: z.object({ enabled: z.boolean(), apiKey: z.string().max(500).optional().or(z.literal("")) }).optional(),
      // TTS
      ttsMicrosoft: z.object({ enabled: z.boolean() }).optional(),
      ttsOpenai: z.object({ enabled: z.boolean() }).optional(),
      ttsElevenlabs: z.object({ enabled: z.boolean(), apiKey: z.string().max(500).optional().or(z.literal("")) }).optional(),
    })
    .optional(),
});

export const adminReferralUpdateSchema = z.object({
  referralId: z.string().uuid(),
  status: z.enum(["PENDING", "ACTIVE", "CHURNED"]),
});

export const adminCouponAssignSchema = z.object({
  tenantId: z.string().uuid(),
  couponId: z.string().min(1).max(100),
});

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "Nieprawidłowe dane",
  };
}
