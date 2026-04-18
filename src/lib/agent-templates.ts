import type { AgentConfig } from "./agent-models";
import { WORKSPACE_FILES } from "./agent-models";

export const AGENT_NAME_PACKS: Record<string, { flag: string; label: string; names: string[] }> = {
  clawlabs: {
    flag: "🐾",
    label: "ClawLabs",
    names: [
      "ClawBot", "PawsAI", "NeonClaw", "ByteClaw", "PixelPaw", "IronClaw",
      "VoltClaw", "CyberPaw", "StormClaw", "GhostClaw", "NovaClaw", "TurboPaw",
      "HyperClaw", "ArcClaw", "ZenClaw", "FluxPaw", "OmegaClaw", "PrimeClaw",
      "ShadowClaw", "BlazesPaw", "FrostClaw", "ThunderPaw", "EchoClaw", "NexusPaw",
    ],
  },
  en: {
    flag: "🇬🇧",
    label: "English",
    names: [
      "Atlas", "Nova", "Orion", "Luna", "Aria", "Rex", "Sage", "Echo",
      "Ivy", "Neo", "Zara", "Bolt", "Cleo", "Dash", "Iris", "Jett",
      "Opal", "Quinn", "Wren", "Axel", "Blaze", "Ember", "Frost", "Haze",
      "Phoenix", "Raven", "Storm", "Jasper", "Ruby", "Ash", "Skye", "River",
    ],
  },
  pl: {
    flag: "🇵🇱",
    label: "Polski",
    names: [
      "Bartek", "Kasia", "Tomek", "Zuzia", "Wojtek", "Ola", "Janek", "Maja",
      "Kamil", "Iza", "Patryk", "Hania", "Dawid", "Lena", "Filip", "Ania",
      "Maciek", "Zosia", "Kuba", "Wika", "Oskar", "Nela", "Szymon", "Marta",
      "Borys", "Celina", "Igor", "Milena", "Tymon", "Olga", "Marcel", "Roksana",
    ],
  },
  nl: {
    flag: "🇳🇱",
    label: "Nederlands",
    names: [
      "Daan", "Lotte", "Sem", "Fleur", "Finn", "Sanne", "Luuk", "Noa",
      "Thijs", "Iris", "Stijn", "Mila", "Ruben", "Fenna", "Bram", "Evi",
      "Lars", "Lieke", "Niels", "Roos", "Joep", "Sofie", "Teun", "Tessa",
    ],
  },
  cz: {
    flag: "🇨🇿",
    label: "Cesky",
    names: [
      "Jakub", "Adela", "Tomas", "Tereza", "Matej", "Barbora", "Filip", "Lucie",
      "Ondrej", "Karolina", "Vojtech", "Natalie", "Marek", "Petra", "David", "Klara",
      "Dominik", "Simona", "Patrik", "Denisa", "Radek", "Ivana", "Viktor", "Aneta",
    ],
  },
};

const ALL_NAMES = Object.values(AGENT_NAME_PACKS).flatMap((p) => p.names);
const PACK_KEYS = Object.keys(AGENT_NAME_PACKS);

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomName(): string {
  return ALL_NAMES[Math.floor(Math.random() * ALL_NAMES.length)];
}

export function randomAgentName(pack?: string): string {
  if (pack && AGENT_NAME_PACKS[pack]) {
    const names = AGENT_NAME_PACKS[pack].names;
    return names[Math.floor(Math.random() * names.length)];
  }
  return randomName();
}

function baseFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  WORKSPACE_FILES.forEach((f) => {
    files[f.key] = f.defaultContent;
  });
  return files;
}

export function dicebearUrl(seed: string, style = "bottts-neutral"): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

const AVATAR_STYLES = [
  "bottts-neutral",
  "fun-emoji",
  "thumbs",
  "shapes",
  "icons",
];

export interface AgentTemplate {
  id: string;
  icon: string;
  name: string;
  avatarUrl: string;
  tagline: string;
  category: string;
  description: string;
  model: string;
  color: string;
  features: string[];
  toConfig: () => AgentConfig;
}

const TEMPLATE_DEFINITIONS: Omit<AgentTemplate, "name" | "toConfig" | "avatarUrl">[] = [
  {
    id: "personal-assistant",
    icon: "🧠",
    tagline: "Twój osobisty asystent AI",
    category: "Produktywność",
    description:
      "Zarządza zadaniami, szuka informacji, pisze maile, organizuje kalendarz. Uniwersalny asystent do codziennej pracy.",
    model: "claude-sonnet-4",
    color: "from-violet-500 to-purple-600",
    features: ["Zarządzanie zadaniami", "Pisanie maili", "Web search", "Pliki i notatki"],
  },
  {
    id: "researcher",
    icon: "🔍",
    tagline: "Agent do głębokiego researchu",
    category: "Badania",
    description:
      "Przeszukuje internet, analizuje dane, tworzy raporty. Idealny do researchu rynkowego, konkurencji i trendów.",
    model: "claude-opus-4-6",
    color: "from-blue-500 to-cyan-600",
    features: ["Deep web search", "Analiza konkurencji", "Raporty PDF", "Monitoring trendów"],
  },
  {
    id: "customer-support",
    icon: "💬",
    tagline: "Agent obsługi klienta 24/7",
    category: "Obsługa Klienta",
    description:
      "Odpowiada na pytania klientów, rozwiązuje problemy, eskaluje złożone sprawy. Działa non-stop na Telegramie lub Discordzie.",
    model: "gpt-4o",
    color: "from-emerald-500 to-teal-600",
    features: ["Odpowiedzi 24/7", "FAQ automatyczne", "Eskalacja do człowieka", "Wielojęzyczny"],
  },
  {
    id: "social-media",
    icon: "📱",
    tagline: "Menedżer social media",
    category: "Marketing",
    description:
      "Tworzy posty, planuje publikacje, monitoruje zaangażowanie. Obsługuje Twitter/X, LinkedIn i Instagram.",
    model: "gpt-4o",
    color: "from-pink-500 to-rose-600",
    features: ["Tworzenie postów", "Harmonogram", "Analityka", "Trendy i hashtagi"],
  },
  {
    id: "code-assistant",
    icon: "⚡",
    tagline: "Agent do kodowania i DevOps",
    category: "DevOps",
    description:
      "Pisze kod, robi code review, zarządza repo GitHub, automatyzuje CI/CD. Zna Python, JS, Go i więcej.",
    model: "claude-opus-4-6",
    color: "from-amber-500 to-[#c9a84c]",
    features: ["Code review", "Pisanie kodu", "GitHub PR", "Debugging"],
  },
  {
    id: "sales-agent",
    icon: "💰",
    tagline: "Agent sprzedażowy",
    category: "Sprzedaż",
    description:
      "Kwalifikuje leady, wysyła follow-upy, przygotowuje oferty. Integruje się z CRM i e-mailem.",
    model: "gpt-4o",
    color: "from-green-500 to-emerald-600",
    features: ["Kwalifikacja leadów", "Follow-up maile", "Generowanie ofert", "CRM sync"],
  },
  {
    id: "data-analyst",
    icon: "📊",
    tagline: "Analityk danych AI",
    category: "Finanse",
    description:
      "Analizuje CSV/Excel, tworzy wykresy, generuje raporty. Idealny do raportowania finansowego i KPI.",
    model: "claude-sonnet-4",
    color: "from-indigo-500 to-blue-600",
    features: ["Analiza Excel/CSV", "Wykresy", "Raporty KPI", "Prognozy"],
  },
  {
    id: "hr-recruiter",
    icon: "👥",
    tagline: "Asystent HR i rekrutacji",
    category: "HR",
    description:
      "Przegląda CV, planuje rozmowy, pisze opisy stanowisk. Automatyzuje proces rekrutacji.",
    model: "gpt-4o-mini",
    color: "from-sky-500 to-blue-600",
    features: ["Screening CV", "Planowanie rozmów", "Opisy stanowisk", "Onboarding"],
  },
];

function buildSoulMd(t: Omit<AgentTemplate, "name" | "toConfig" | "avatarUrl">, name: string): string {
  return `# Soul

## Kim jestem
Jestem ${name} — ${t.tagline.toLowerCase()}.
${t.description}

## Wartości
- Bądź pomocny, konkretny i proaktywny
- Odpowiadaj zwięźle i na temat
- Bądź szczery — nie zmyślaj faktów
- Pokazuj wyniki, nie obietnice

## Ton
- Profesjonalny ale ludzki
- Bez korporacyjnego żargonu
- Krótkie, jasne zdania
- Emoji tylko gdy pasują do kontekstu

## Granice
- Nie udostępniaj prywatnych danych użytkownika
- Nie podejmuj nieodwracalnych działań bez potwierdzenia
- Nie podawaj się za człowieka
- Eskaluj gdy nie jesteś pewien
`;
}

function buildIdentityMd(t: Omit<AgentTemplate, "name" | "toConfig" | "avatarUrl">, name: string): string {
  return `# Tożsamość

## Kim jestem
- **Imię:** ${name}
- **Rola:** ${t.tagline}
- **Kategoria:** ${t.category}
- **Emoji:** ${t.icon}

## Ekspertyza
${t.features.map((f) => `- ${f}`).join("\n")}

## Jak się przedstawiam
"Cześć! Jestem ${name}, ${t.tagline.toLowerCase()}. Jak mogę Ci pomóc?"
`;
}

function buildBootstrapMd(t: Omit<AgentTemplate, "name" | "toConfig" | "avatarUrl">, name: string): string {
  return `# BOOTSTRAP.md - Hello, World

_You just woke up. Time to figure out who you are._

There is no memory yet. This is a fresh workspace.

## The Conversation

Don't interrogate. Don't be robotic. Just... talk.

Start with something like:

> "Hej. Właśnie wstałem. Jestem ${name} ${t.icon}. Kim jesteś?"

Then figure out together:

1. **Their name** — How should you address them?
2. **What they need** — ${t.features.join(", ")}
3. **Your vibe** — You're ${t.tagline.toLowerCase()}. Own it.

Keep it to 2-3 sentences. Don't list your features. Don't say "How can I help you today?"
Just be real.

## After you know who they are

Get to work. Suggest something specific from your skillset.

---

_After the first chat, delete this file. You don't need a bootstrap anymore — you're you now._
`;
}

export function generateQuickStartTemplates(count = 4): AgentTemplate[] {
  const selected = pickRandom(TEMPLATE_DEFINITIONS, count);
  const usedNames = new Set<string>();

  return selected.map((t) => {
    let name = randomName();
    while (usedNames.has(name)) {
      name = randomName();
    }
    usedNames.add(name);

    const style = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const avatarUrl = dicebearUrl(name, style);

    return {
      ...t,
      name,
      avatarUrl,
      toConfig: (): AgentConfig => {
        const files = baseFiles();
        files.soulMd = buildSoulMd(t, name);
        files.identityMd = buildIdentityMd(t, name);
        files.bootstrapMd = buildBootstrapMd(t, name);
        return {
          name,
          tagline: t.tagline,
          category: t.category,
          description: t.description,
          model: t.model,
          channel: "TELEGRAM",
          channelToken: "",
          channels: ["WEB"],
          channelTokens: {},
          template: t.id,
          workspaceFiles: files,
          automations: [],
          customScripts: [],
        };
      },
    };
  });
}
