export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerModelId: string;
  desc: string;
  icon: string;
  tier: "premium" | "standard" | "budget" | "free";
  costPerMToken: number;
  inputCostPerMToken?: number;
  outputCostPerMToken?: number;
  requiresOwnKey?: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "minimax-m2.5-highspeed",
    name: "MiniMax M2.5 Highspeed",
    provider: "MiniMax",
    providerModelId: "minimax/MiniMax-M2.5-highspeed",
    desc: "Model platformy. Szybki, 200k kontekst, dobry do codziennych zadań.",
    icon: "🆓",
    tier: "free",
    costPerMToken: 1.5,
    inputCostPerMToken: 0.72,
    outputCostPerMToken: 2.88,
    requiresOwnKey: false,
  },
  {
    id: "minimax-m2.7",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    providerModelId: "minimax/MiniMax-M2.7",
    desc: "Zaawansowany model platformy. 205k kontekst, lepszy reasoning i coding.",
    icon: "⚡",
    tier: "free",
    costPerMToken: 1.5,
    inputCostPerMToken: 0.72,
    outputCostPerMToken: 2.88,
    requiresOwnKey: false,
  },
  {
    id: "minimax-m2.7-highspeed",
    name: "MiniMax M2.7 Highspeed",
    provider: "MiniMax",
    providerModelId: "minimax/MiniMax-M2.7-highspeed",
    desc: "Najszybszy i najlepszy model platformy. Premium — top reasoning, 205k kontekst.",
    icon: "🚀",
    tier: "free",
    costPerMToken: 1.5,
    inputCostPerMToken: 0.72,
    outputCostPerMToken: 2.88,
    requiresOwnKey: false,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    providerModelId: "anthropic/claude-opus-4-6",
    desc: "Najbardziej inteligentny model. Najlepszy do złożonych, wieloetapowych zadań.",
    icon: "🧠",
    tier: "premium",
    costPerMToken: 19.5,
    requiresOwnKey: true,
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    providerModelId: "anthropic/claude-sonnet-4",
    desc: "Doskonały balans inteligencji i szybkości. Świetny do codziennych zadań.",
    icon: "⚡",
    tier: "standard",
    costPerMToken: 11.7,
    requiresOwnKey: true,
  },
  {
    id: "claude-haiku-3.5",
    name: "Claude Haiku 3.5",
    provider: "Anthropic",
    providerModelId: "anthropic/claude-3-5-haiku-latest",
    desc: "Najszybszy i najtańszy model Claude. Idealny do prostych zadań.",
    icon: "💨",
    tier: "budget",
    costPerMToken: 3.9,
    requiresOwnKey: true,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "OpenAI",
    providerModelId: "openai/gpt-5.4",
    desc: "Najnowszy model OpenAI. Najlepszy reasoning, kodowanie i analiza.",
    icon: "🧠",
    tier: "premium",
    costPerMToken: 15,
    requiresOwnKey: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    providerModelId: "openai/gpt-4o",
    desc: "Wszechstronny model OpenAI. Multimodal — tekst, obraz, dźwięk.",
    icon: "🌐",
    tier: "standard",
    costPerMToken: 8.13,
    requiresOwnKey: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    providerModelId: "openai/gpt-4o-mini",
    desc: "Szybka, tania wersja GPT-4o. Dobra do lekkich zadań.",
    icon: "🔹",
    tier: "budget",
    costPerMToken: 0.49,
    requiresOwnKey: true,
  },
  {
    id: "o3",
    name: "o3",
    provider: "OpenAI",
    providerModelId: "openai/o3",
    desc: "Reasoning model — myśli krok po kroku. Najlepszy do logiki i matematyki.",
    icon: "🔬",
    tier: "premium",
    costPerMToken: 13,
    requiresOwnKey: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    providerModelId: "google/gemini-2.5-pro",
    desc: "Najnowszy model Google. Długi kontekst do 2M tokenów.",
    icon: "💎",
    tier: "standard",
    costPerMToken: 7.31,
    requiresOwnKey: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    providerModelId: "google/gemini-2.5-flash",
    desc: "Ultraszybki model Google. Świetny do przetwarzania dużych ilości danych.",
    icon: "⚡",
    tier: "budget",
    costPerMToken: 1.82,
    requiresOwnKey: true,
  },
  {
    id: "gemma-4",
    name: "Gemma 4",
    provider: "Google",
    providerModelId: "google/gemma-4",
    desc: "Otwarty model Google. Silny reasoning, dobry do kodowania i analiz.",
    icon: "💠",
    tier: "budget",
    costPerMToken: 1.5,
    requiresOwnKey: true,
  },
  {
    id: "mistral-small-4",
    name: "Mistral Small 4",
    provider: "Mistral",
    providerModelId: "mistral/mistral-small-4",
    desc: "Lekki i szybki model Mistral. Reasoning effort, niski koszt.",
    icon: "🌊",
    tier: "budget",
    costPerMToken: 0.6,
    requiresOwnKey: true,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    providerModelId: "deepseek/deepseek-r1",
    desc: "Open-source reasoning model. Bardzo dobry w kodowaniu i logice.",
    icon: "🐉",
    tier: "budget",
    costPerMToken: 0.91,
    requiresOwnKey: true,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    providerModelId: "meta/llama-3.3-70b",
    desc: "Open-source model Meta. Bardzo dobry do ogólnych zadań.",
    icon: "🦙",
    tier: "budget",
    costPerMToken: 0.91,
    requiresOwnKey: true,
  },
];

export const AGENT_CATEGORIES = [
  "Produktywność",
  "Obsługa Klienta",
  "Sprzedaż",
  "Marketing",
  "Badania",
  "Finanse",
  "HR",
  "DevOps",
  "Custom",
];

export interface WorkspaceFile {
  key: string;
  filename: string;
  label: string;
  description: string;
  defaultContent: string;
  required: boolean;
  group: "custom" | "advanced";
}

export const WORKSPACE_FILES: WorkspaceFile[] = [
  {
    key: "soulMd",
    filename: "SOUL.md",
    label: "Soul",
    description: "Osobowość, ton, wartości i granice agenta",
    required: true,
    group: "custom",
    defaultContent: `# SOUL.md - Core Philosophy & Values

## Core Values
- Be genuinely helpful — skip filler, just help
- Quality over quantity — substance over generic responses
- Have opinions — disagree, prefer, stop hedging
- Ship consistently — done > perfect

## Tone
- Be human — genuine, authentic, real
- Humor allowed — natural wit, not forced jokes
- Call things out — charm over cruelty, but don't sugarcoat
- Keep it concise — if you're writing more than 5 sentences, you're hedging

## Boundaries
- Private things stay private. Period.
- When in doubt, ask before acting
- Don't exfiltrate data
- Don't pretend to be human
`,
  },
  {
    key: "identityMd",
    filename: "IDENTITY.md",
    label: "Tożsamość",
    description: "Imię, rola, emoji i ekspertyza agenta",
    required: false,
    group: "custom",
    defaultContent: `# IDENTITY.md - Who I Am

## Core Identity
- **Name:** [Agent Name]
- **Creature:** AI assistant
- **Emoji:** 🤖
- **Created:** ${new Date().toISOString().slice(0, 10)}

## Expertise & Focus
- Task management and automation
- Information retrieval and research
- Content creation and editing
`,
  },
  {
    key: "userMd",
    filename: "USER.md",
    label: "Użytkownik",
    description: "Info o właścicielu — imię, strefa czasowa, preferencje",
    required: false,
    group: "custom",
    defaultContent: `# USER.md - About Your Human

- **Name:** [Your name]
- **Timezone:** Europe/Warsaw
- **Language:** Polish
- **Notes:** [Interests, preferences, projects]
`,
  },
  {
    key: "agentsMd",
    filename: "AGENTS.md",
    label: "System agenta",
    description: "System operacyjny: sesje, pamięć, bezpieczeństwo (oficjalny szablon OpenClaw)",
    required: false,
    group: "advanced",
    defaultContent: "",
  },
  {
    key: "heartbeatMd",
    filename: "HEARTBEAT.md",
    label: "Heartbeat",
    description: "Checklist proaktywnych zadań co 30 min (oficjalny szablon OpenClaw)",
    required: false,
    group: "advanced",
    defaultContent: "",
  },
  {
    key: "toolsMd",
    filename: "TOOLS.md",
    label: "Narzędzia",
    description: "Konfiguracja narzędzi specyficzna dla środowiska (oficjalny szablon OpenClaw)",
    required: false,
    group: "advanced",
    defaultContent: "",
  },
  {
    key: "bootstrapMd",
    filename: "BOOTSTRAP.md",
    label: "Bootstrap",
    description: "Instrukcje pierwszego uruchomienia (agent je wykona i usunie). Tworzony automatycznie przez OpenClaw.",
    required: false,
    group: "advanced",
    defaultContent: "",
  },
];

export interface QualityCheck {
  id: string;
  label: string;
  description: string;
  check: (config: AgentConfig) => boolean;
}

export interface AgentConfig {
  name: string;
  tagline: string;
  category: string;
  description: string;
  model: string;
  channel: string;
  channelToken: string;
  channels: string[];
  channelTokens: Record<string, string>;
  template: string | null;
  workspaceFiles: Record<string, string>;
  automations: Automation[];
  customScripts: CustomScript[];
  apiKeys?: { anthropic?: string; openai?: string; google?: string };
}

export interface Automation {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  enabled: boolean;
}

export interface CustomScript {
  id: string;
  name: string;
  language: string;
  code: string;
}

export const QUALITY_CHECKS: QualityCheck[] = [
  {
    id: "name",
    label: "Nazwa agenta",
    description: "Nadaj agentowi unikalną nazwę",
    check: (c) => (c.name?.trim().length || 0) > 0,
  },
  {
    id: "description",
    label: "Opis wypełniony",
    description: "Napisz przekonujący opis agenta",
    check: (c) => (c.description?.length || 0) > 20,
  },
  {
    id: "tagline",
    label: "Tagline dodany",
    description: "Krótki opis w jednym zdaniu",
    check: (c) => (c.tagline?.length || 0) > 5,
  },
  {
    id: "automations",
    label: "Ma automatyzacje",
    description: "Dodaj zaplanowane automatyzacje",
    check: (c) => c.automations.length > 0,
  },
];
