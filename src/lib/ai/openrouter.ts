// OpenRouter client — darmowy dostęp do Gemma 4 i innych modeli
// `google/gemma-4-27b-it:free` jest dostępny w puli `:free` OpenRouter (~20 req/min)
//
// Używamy OpenRouter jako:
// 1. Tani fallback kiedy OpenClaw Gateway jest niedostępny
// 2. Image analysis z Gemma 4 (klasyfikacja uprawy, segmentacja pola z obrazu satelitarnego)
// 3. Szybkie klasyfikatory (np. "czy to stres suszowy czy choroba?") — mniej kosztowne niż Claude
//
// Docs: https://openrouter.ai/docs

import { fetchWithTimeout } from '@/lib/satellite/http';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Vision-capable modele na OpenRouter — TYLKO te faktycznie obecne w katalogu
// (zweryfikowane GET /api/v1/models). Wcześniej chain zawierał 3 nieistniejące
// slugi (qwen ...-2.5-...:free, llama-3.2-11b-...:free, gemini-2.0-flash-exp:free),
// przez co środek łańcucha zawsze rzucał błąd i wydłużał failover. Audyt: model list.
export type VisionModel =
  | 'google/gemma-4-31b-it:free'
  | 'google/gemma-4-31b-it'
  | 'google/gemma-4-26b-a4b-it:free'
  | 'google/gemma-4-26b-a4b-it'
  | 'qwen/qwen2.5-vl-72b-instruct'; // poprawny slug (bez myślnika, wariant paid)

// Fallback chain: najpierw darmowa Gemma 4 31B (najlepsze diagnozy PL), potem ten
// sam model paid (bez rate-limitu), darmowa mniejsza Gemma, non-Google backup (Qwen VL),
// na końcu paid Gemma 26B.
const VISION_FALLBACK_CHAIN: VisionModel[] = [
  'google/gemma-4-31b-it:free', // #1 preferowany (free priority)
  'google/gemma-4-31b-it', // #2 ten sam paid — bez rate-limitu
  'google/gemma-4-26b-a4b-it:free', // #3 Gemma mniejsza :free
  'qwen/qwen2.5-vl-72b-instruct', // #4 non-Google backup — inny bucket
  'google/gemma-4-26b-a4b-it', // #5 ostatni ratunek paid
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >;
}

export interface OpenRouterCompletionResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface OpenRouterCompletionOptions {
  model?: VisionModel | (string & {});
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
  fallback?: boolean; // jeśli true, próbuje chainu modelowego
}

export class OpenRouterClient {
  constructor(
    private readonly apiKey: string = process.env.OPENROUTER_API_KEY ?? '',
    private readonly defaultModel: VisionModel = 'google/gemma-4-31b-it:free',
  ) {
    if (!apiKey) {
      throw new Error('OpenRouterClient: brak OPENROUTER_API_KEY');
    }
  }

  private async completionSingle(
    model: string,
    opts: OpenRouterCompletionOptions,
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 1024,
    };
    if (opts.json) body.response_format = { type: 'json_object' };

    const res = await fetchWithTimeout(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agriclaw.pl',
        'X-Title': 'AgriClaw',
      },
      body: JSON.stringify(body),
      timeoutMs: 60_000,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter ${model} failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as OpenRouterCompletionResponse;
    return data.choices[0]?.message?.content ?? '';
  }

  async completion(opts: OpenRouterCompletionOptions): Promise<string> {
    const preferredModel = opts.model ?? this.defaultModel;
    const tryFallback = opts.fallback !== false;

    const candidates = tryFallback
      ? [preferredModel, ...VISION_FALLBACK_CHAIN.filter((m) => m !== preferredModel)]
      : [preferredModel];

    const errors: string[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const model = candidates[i];
      try {
        const result = await this.completionSingle(model, opts);
        if (i > 0) {
          console.info(`[OpenRouter] Udało się na fallback #${i}: ${model}`);
        }
        return result;
      } catch (err) {
        const msg = String(err);
        errors.push(`${model}: ${msg.slice(0, 150)}`);
        const isRateLimit = msg.includes('429') || msg.includes('rate-limit');
        // Jeśli 429, daj upstream odsapnąć — exponential backoff
        if (isRateLimit && i < candidates.length - 1) {
          const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s...
          console.warn(`[OpenRouter] ${model} rate-limited, odczekuję ${delay}ms przed fallbackiem`);
          await sleep(delay);
        }
      }
    }

    throw new Error(
      `Wszystkie darmowe modele OpenRouter są chwilowo zajęte (rate limit). ` +
        `Spróbuj ponownie za 30-60 sekund, albo dodaj własny klucz Google AI Studio ` +
        `w ustawieniach OpenRouter (openrouter.ai/settings/integrations) żeby nie dzielić limitów. ` +
        `Szczegóły: ${errors.slice(0, 2).join(' | ')}`,
    );
  }

  /**
   * Analizuje obraz satelitarny i zwraca strukturalną informację o polu.
   * Używamy do: klasyfikacji uprawy, diagnozy stresu, szybkiej segmentacji.
   */
  async analyzeSatelliteImage(opts: {
    imageUrl: string; // data URL albo https://
    instruction: string;
    jsonSchema?: string;
  }): Promise<string> {
    const systemPrompt = opts.jsonSchema
      ? `Jesteś ekspertem rolniczym. Analizujesz zdjęcia satelitarne i pól.
Odpowiadasz TYLKO poprawnym JSON zgodnym ze schematem:
${opts.jsonSchema}`
      : `Jesteś ekspertem rolniczym. Analizujesz zdjęcia satelitarne i pól. Odpowiadasz krótko i konkretnie po polsku.`;

    return this.completion({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: opts.instruction },
            { type: 'image_url', image_url: { url: opts.imageUrl } },
          ],
        },
      ],
      json: Boolean(opts.jsonSchema),
      temperature: 0.2,
      // Rozbudowany JSON diagnozy (objawy[], środki[] z dawkami, porada) przekracza
      // domyślne 1024 tokeny → ucięty JSON.parse rzucał 502. Audyt 2.6.
      max_tokens: 2500,
    });
  }
}

export function getOpenRouterClient(): OpenRouterClient {
  return new OpenRouterClient();
}
