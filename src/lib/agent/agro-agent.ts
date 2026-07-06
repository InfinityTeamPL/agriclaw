// AgroAgent v2 — wbudowany agent czatu (MiniMax-M3, pętla tool-calling).
// Zastępuje wymóg VM OpenClaw dla podstawowego czatu: narzędzia to BEZPOŚREDNIE
// wywołania naszych funkcji (zero HTTP-do-siebie, zero skill-tokenów), działa
// dla każdego gospodarstwa od pierwszej sekundy (koniec 409 „Brak agenta").
// OpenClaw pozostaje opcjonalnym silnikiem (farmy z wdrożonym agentem go używają).
//
// Dyscyplina merytoryczna współdzielona z OpenClaw: buildAgroDecisionRules +
// PROMPT_ADVISORY_DISCIPLINE + twardy bezpiecznik withAdvisoryDisclaimer.

import { prisma } from '../prisma';
import { fetchWeatherForecast } from '../satellite/weather';
import { classifyNdvi, describeNdvi } from '../satellite/ndvi';
import { checkSorProduct } from '../sor-registry';
import { PROMPT_ADVISORY_DISCIPLINE, withAdvisoryDisclaimer } from '../advisory';
import {
  buildAgroDecisionRules,
  AGRO_STYLE_GUIDE,
  CROP_PL,
  type FarmContext,
} from '../openclaw-prompt';
import {
  minimaxChatStream,
  type LlmMessage,
  type LlmToolDef,
  type LlmToolCall,
} from '../ai/minimax';

const MAX_TOOL_ROUNDS = 5;

// ── Prompt ──

export function buildAgroAgentV2Prompt(ctx: FarmContext): string {
  const fieldsList = ctx.fields.length
    ? ctx.fields
        .map(
          (f) =>
            `- ${f.name} (${CROP_PL[f.crop] ?? f.crop}, kod uprawy: ${f.crop}, ${f.areaHectares.toFixed(2)} ha, field_id=${f.id})`,
        )
        .join('\n')
    : '(brak pól — rolnik dopiero zakłada gospodarstwo)';

  return `Jesteś AgroAgent — cyfrowy doradca rolniczy dla polskiego rolnika.

## Zasady komunikacji
- Mówisz KRÓTKO, KONKRETNIE, po polsku. Bez marketingu, bez emotek.
- Rolnik jest w polu, na telefonie. Każde zdanie musi mieć znaczenie.
- Jeśli nie masz danych, ZAWSZE wywołaj odpowiednie narzędzie zamiast zmyślać.
- Narzędzia dostajesz w API (function calling) — używaj ich, wyniki cytuj liczbowo.

${PROMPT_ADVISORY_DISCIPLINE}

## Kontekst gospodarstwa
- **Nazwa:** ${ctx.farmName}
- **Adres:** ${ctx.address}
- **Pola:**
${fieldsList}

## Reguły decyzyjne
${buildAgroDecisionRules({
  ndvi: 'get_field_ndvi',
  weather: 'get_weather_forecast',
  history: 'get_field_history',
  sorCheck: 'check_sor_product(product, crop)',
})}

## Styl odpowiedzi
${AGRO_STYLE_GUIDE}`;
}

// ── Narzędzia (bezpośrednie, zawsze zawężone do farmy!) ──

const TOOL_DEFS: LlmToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'get_field_ndvi',
      description:
        'Aktualny stan pola z Sentinel-2: NDVI (średnia/min/max), klasyfikacja, trend vs poprzedni pomiar. Wywołaj PRZED każdą oceną kondycji pola.',
      parameters: {
        type: 'object',
        properties: { field_id: { type: 'string', description: 'field_id z listy pól' } },
        required: ['field_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather_forecast',
      description:
        'Prognoza pogody dla pola (Open-Meteo): dni bez deszczu, opady 7 dni, ET0, ryzyko suszy, dzienne temp/opad/wiatr.',
      parameters: {
        type: 'object',
        properties: {
          field_id: { type: 'string' },
          days: { type: 'number', description: '1-7, domyślnie 7' },
        },
        required: ['field_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_field_history',
      description: 'Historia NDVI pola (do 90 dni) + ostatnie rekomendacje. Do oceny trendu.',
      parameters: {
        type: 'object',
        properties: {
          field_id: { type: 'string' },
          days: { type: 'number', description: '7-90, domyślnie 30' },
        },
        required: ['field_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_sor_product',
      description:
        'OBOWIĄZKOWE przed wymienieniem środka ochrony roślin: sprawdza produkt w oficjalnym rejestrze MRiRW — status prawny (aktualny/wyprzedaz/do_zuzycia/wycofany), zastosowania w uprawie, dawkę z rejestru, link do etykiety.',
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'nazwa handlowa środka' },
          crop: { type: 'string', description: 'kod uprawy pola (np. wheat) — z listy pól' },
        },
        required: ['product'],
      },
    },
  },
];

async function assertFieldInFarm(farmId: string, fieldId: string) {
  const field = await prisma.field.findFirst({
    where: { id: fieldId, farmId, deletedAt: null },
    select: { id: true, name: true, crop: true },
  });
  if (!field) throw new Error(`Pole ${fieldId} nie należy do tego gospodarstwa (użyj field_id z listy pól).`);
  return field;
}

async function fieldCentroid(fieldId: string): Promise<{ lat: number; lon: number }> {
  const rows = await prisma.$queryRaw<Array<{ lat: number; lon: number }>>`
    SELECT ST_Y(ST_Centroid(polygon)) AS lat, ST_X(ST_Centroid(polygon)) AS lon
    FROM "fields" WHERE id = ${fieldId} LIMIT 1
  `;
  if (!rows[0]) throw new Error('Brak geometrii pola');
  return rows[0];
}

async function executeTool(
  farmId: string,
  call: LlmToolCall,
): Promise<Record<string, unknown>> {
  let args: Record<string, unknown> = {};
  try {
    args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
  } catch {
    return { error: 'Niepoprawny JSON w argumentach narzędzia' };
  }

  switch (call.function.name) {
    case 'get_field_ndvi': {
      const field = await assertFieldInFarm(farmId, String(args.field_id ?? ''));
      const readings = await prisma.ndviReading.findMany({
        where: { fieldId: field.id, source: { not: 'mock' } },
        orderBy: { observedAt: 'desc' },
        take: 2,
      });
      if (readings.length === 0) {
        return {
          status: 'no_data',
          hint: 'Brak zapisanej analizy — poproś rolnika o uruchomienie analizy pola w aplikacji.',
        };
      }
      const [latest, prev] = readings;
      return {
        field: { id: field.id, name: field.name, crop: field.crop },
        ndvi: {
          mean: latest.ndviMean,
          min: latest.ndviMin,
          max: latest.ndviMax,
          observed_at: latest.observedAt.toISOString(),
          classification: classifyNdvi(latest.ndviMean),
          description: describeNdvi(latest.ndviMean, field.crop),
        },
        ndre_mean: latest.ndreMean,
        ndwi_mean: latest.ndwiMean,
        trend: prev
          ? {
              previous_mean: prev.ndviMean,
              previous_observed_at: prev.observedAt.toISOString(),
              delta: latest.ndviMean - prev.ndviMean,
            }
          : null,
      };
    }

    case 'get_weather_forecast': {
      const field = await assertFieldInFarm(farmId, String(args.field_id ?? ''));
      const { lat, lon } = await fieldCentroid(field.id);
      const days = Math.min(Math.max(Number(args.days) || 7, 1), 7);
      const w = await fetchWeatherForecast(lat, lon, days);
      return {
        field: { id: field.id, name: field.name },
        days_without_rain: w.daysWithoutRain,
        total_precip_next: w.totalPrecipNext7,
        avg_et0_next: w.avgEt0Next7,
        drought_risk: w.droughtRiskLevel,
        daily: w.daily.dates.map((date, i) => ({
          date,
          temp_max: w.daily.tempMax[i],
          temp_min: w.daily.tempMin[i],
          precipitation_mm: w.daily.precipitation[i],
          et0_mm: w.daily.et0[i],
          wind_max_kmh: w.daily.windMaxKmh[i],
        })),
      };
    }

    case 'get_field_history': {
      const field = await assertFieldInFarm(farmId, String(args.field_id ?? ''));
      const days = Math.min(Math.max(Number(args.days) || 30, 7), 90);
      const since = new Date(Date.now() - days * 864e5);
      const [readings, recs] = await Promise.all([
        prisma.ndviReading.findMany({
          where: { fieldId: field.id, source: { not: 'mock' }, observedAt: { gte: since } },
          orderBy: { observedAt: 'asc' },
          select: { observedAt: true, ndviMean: true },
        }),
        prisma.recommendation.findMany({
          where: { fieldId: field.id, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { createdAt: true, severity: true, title: true },
        }),
      ]);
      return {
        field: { id: field.id, name: field.name },
        readings: readings.map((r) => ({ date: r.observedAt.toISOString().slice(0, 10), ndvi: r.ndviMean })),
        recent_recommendations: recs,
      };
    }

    case 'check_sor_product': {
      const product = String(args.product ?? '').trim();
      const crop = args.crop ? String(args.crop) : undefined;
      return (await checkSorProduct(product, crop)) as unknown as Record<string, unknown>;
    }

    default:
      return { error: `Nieznane narzędzie: ${call.function.name}` };
  }
}

// ── Pętla agenta ──

export interface AgroAgentResult {
  content: string;
  toolRounds: number;
  toolNames: string[];
  model: string;
}

/**
 * Uruchamia pętlę tool-calling. Deltę treści emitujemy TYLKO z finalnej rundy
 * (rundy narzędziowe bywają poprzedzone szumem tekstowym) — dlatego buforujemy
 * per runda i flushujemy, gdy runda kończy się bez tool_calls.
 */
export async function runAgroAgent(opts: {
  farmId: string;
  ctx: FarmContext;
  history: LlmMessage[]; // poprzednie tury USER/ASSISTANT (bez systemu)
  userMessage: string;
  onDelta?: (text: string) => void;
}): Promise<AgroAgentResult> {
  const model = process.env.AGENT_MODEL ?? 'MiniMax-M3';
  const messages: LlmMessage[] = [
    { role: 'system', content: buildAgroAgentV2Prompt(opts.ctx) },
    ...opts.history,
    { role: 'user', content: opts.userMessage },
  ];

  const toolNames: string[] = [];
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let buffered = '';
    const result = await minimaxChatStream({
      messages,
      tools: TOOL_DEFS,
      model,
      onDelta: (t) => {
        buffered += t;
      },
    });

    if (result.toolCalls.length === 0) {
      // Finalna odpowiedź — twardy bezpiecznik ŚOR i emisja do klienta.
      const final = withAdvisoryDisclaimer(result.content);
      opts.onDelta?.(final);
      return { content: final, toolRounds: round, toolNames, model };
    }

    // Runda narzędziowa: dopisz assistant(tool_calls) + wyniki, kontynuuj.
    messages.push({
      role: 'assistant',
      content: result.content || null,
      tool_calls: result.toolCalls,
    });
    const results = await Promise.all(
      result.toolCalls.map(async (call) => {
        toolNames.push(call.function.name);
        try {
          return await executeTool(opts.farmId, call);
        } catch (err) {
          return { error: String(err instanceof Error ? err.message : err) };
        }
      }),
    );
    result.toolCalls.forEach((call, i) => {
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(results[i]),
      });
    });
    void buffered; // treść rund narzędziowych świadomie porzucona
  }

  // Limit rund — poproś model o odpowiedź BEZ narzędzi.
  messages.push({
    role: 'user',
    content: 'Odpowiedz teraz na podstawie zebranych danych, bez kolejnych narzędzi.',
  });
  const last = await minimaxChatStream({ messages, model });
  const final = withAdvisoryDisclaimer(last.content);
  opts.onDelta?.(final);
  return { content: final, toolRounds: MAX_TOOL_ROUNDS, toolNames, model };
}
