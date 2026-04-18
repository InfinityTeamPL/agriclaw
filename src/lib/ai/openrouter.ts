// OpenRouter client — darmowy dostęp do Gemma 4 i innych modeli
// `google/gemma-4-27b-it:free` jest dostępny w puli `:free` OpenRouter (~20 req/min)
//
// Używamy OpenRouter jako:
// 1. Tani fallback kiedy OpenClaw Gateway jest niedostępny
// 2. Image analysis z Gemma 4 (klasyfikacja uprawy, segmentacja pola z obrazu satelitarnego)
// 3. Szybkie klasyfikatory (np. "czy to stres suszowy czy choroba?") — mniej kosztowne niż Claude
//
// Docs: https://openrouter.ai/docs

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Vision-capable modele na OpenRouter (stan kwiecień 2026).
// Gemma 4 26B A4B (MoE) jest dostępna jako `google/gemma-4-26b-a4b-it:free`.
export type VisionModel =
  | 'google/gemma-4-26b-a4b-it:free'
  | 'meta-llama/llama-3.2-11b-vision-instruct:free'
  | 'meta-llama/llama-3.2-90b-vision-instruct:free'
  | 'qwen/qwen-2.5-vl-72b-instruct:free'
  | 'google/gemma-3-27b-it:free'
  | 'google/gemini-2.0-flash-exp:free';

// Fallback chain — priorytet: Gemma 4 → Llama Vision → Qwen VL → Gemini.
const VISION_FALLBACK_CHAIN: VisionModel[] = [
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'qwen/qwen-2.5-vl-72b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
];

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
    private readonly defaultModel: VisionModel = 'google/gemma-4-26b-a4b-it:free',
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

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agriclaw.pl',
        'X-Title': 'AgriClaw',
      },
      body: JSON.stringify(body),
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
    const tryFallback = opts.fallback !== false; // domyślnie true

    // Pierwsza próba: preferowany model
    try {
      return await this.completionSingle(preferredModel, opts);
    } catch (err) {
      if (!tryFallback) throw err;
      const errMsg = String(err);
      console.warn(`[OpenRouter] ${preferredModel} failed: ${errMsg}. Trying fallback chain…`);

      // Fallback chain — próbujemy kolejne modele (pomijając ten który już padł)
      const chain = VISION_FALLBACK_CHAIN.filter((m) => m !== preferredModel);
      for (const fallbackModel of chain) {
        try {
          return await this.completionSingle(fallbackModel, opts);
        } catch (fbErr) {
          console.warn(`[OpenRouter] fallback ${fallbackModel} failed: ${fbErr}`);
        }
      }

      // Nic nie zadziałało — zgłoś pierwszy błąd
      throw new Error(
        `OpenRouter: wszystkie modele zawiodły. Ostatni błąd: ${errMsg}`,
      );
    }
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
    });
  }
}

export function getOpenRouterClient(): OpenRouterClient {
  return new OpenRouterClient();
}
