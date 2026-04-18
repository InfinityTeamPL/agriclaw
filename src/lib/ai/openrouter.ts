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

export type GemmaModel =
  | 'google/gemma-4-27b-it:free'
  | 'google/gemma-4-9b-it:free'
  | 'google/gemma-2-27b-it:free'
  | 'google/gemma-2-9b-it:free';

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
  model?: GemmaModel | (string & {});
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
}

export class OpenRouterClient {
  constructor(
    private readonly apiKey: string = process.env.OPENROUTER_API_KEY ?? '',
    private readonly defaultModel: GemmaModel = 'google/gemma-4-27b-it:free',
  ) {
    if (!apiKey) {
      throw new Error('OpenRouterClient: brak OPENROUTER_API_KEY');
    }
  }

  async completion(opts: OpenRouterCompletionOptions): Promise<string> {
    const body: Record<string, unknown> = {
      model: opts.model ?? this.defaultModel,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 1024,
    };

    if (opts.json) {
      body.response_format = { type: 'json_object' };
    }

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
      throw new Error(`OpenRouter failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as OpenRouterCompletionResponse;
    return data.choices[0]?.message?.content ?? '';
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
