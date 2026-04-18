// POST /api/diagnose — diagnoza z kamery.
// Rolnik wysyła zdjęcie liścia/rośliny → Gemma 4 27B (via OpenRouter) analizuje
// i zwraca JSON z diagnozą + rekomendacją środka ochrony roślin.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getOpenRouterClient } from '@/lib/ai/openrouter';

const bodySchema = z.object({
  imageBase64: z.string().startsWith('data:image/'),
  fieldId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

const DIAGNOSIS_SCHEMA = `{
  "diagnoza": "krótka diagnoza po polsku (np. 'rdza brunatna pszenicy')",
  "pewnosc": "wysoka | średnia | niska",
  "typProblemu": "choroba_grzybowa | szkodnik | niedobor | chwast | herbicyd | mechaniczne | inne",
  "objawy": ["lista widocznych objawów"],
  "rekomendacja": {
    "pilnosc": "pilne | w_ciagu_tygodnia | monitoruj",
    "akcja": "konkretna akcja do wykonania",
    "srodki": [
      { "typ": "fungicyd | herbicyd | insektycyd | nawoz | inne", "substancja_czynna": "nazwa", "przyklad_handlowy": "przykładowa nazwa handlowa PL", "dawka": "np. 1L/ha" }
    ],
    "okno_oprysku": "np. rano 5:30-9:00, bez wiatru >15 km/h"
  },
  "porada_dodatkowa": "jedno zdanie kontekstu"
}`;

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Jeśli fieldId podane, zweryfikuj własność + dociągnij kontekst (uprawa)
  let fieldContext: { crop: string; name: string } | null = null;
  if (parsed.data.fieldId) {
    const field = await prisma.field.findFirst({
      where: {
        id: parsed.data.fieldId,
        farm: { userId: user.id },
      },
      select: { name: true, crop: true },
    });
    if (!field) {
      return NextResponse.json({ error: 'Pole nie znalezione' }, { status: 404 });
    }
    fieldContext = field;
  }

  const cropLabelMap: Record<string, string> = {
    wheat: 'pszenica',
    corn: 'kukurydza',
    rapeseed: 'rzepak',
    barley: 'jęczmień',
    potato: 'ziemniaki',
    rye: 'żyto',
    oats: 'owies',
    sugarbeet: 'burak cukrowy',
  };

  const cropHint = fieldContext
    ? `Uprawa na polu: ${cropLabelMap[fieldContext.crop] ?? fieldContext.crop}.`
    : 'Uprawa nieznana — rozpoznaj z zdjęcia.';

  const userNoteHint = parsed.data.note
    ? `Dodatkowy kontekst od rolnika: „${parsed.data.note}"`
    : '';

  const instruction = `Obejrzyj zdjęcie i zdiagnozuj problem u rośliny. ${cropHint} ${userNoteHint}

WAŻNE: Jeśli nie widzisz wyraźnego problemu na zdjęciu, ustaw diagnoza="brak problemów widocznych" i pewnosc="niska".

Nie używaj generic rad. Konkretna substancja czynna + przykład handlowy dostępny w Polsce. Dawki zgodne z etykietą PL.`;

  let rawResponse: string;
  try {
    const client = getOpenRouterClient();
    rawResponse = await client.analyzeSatelliteImage({
      imageUrl: parsed.data.imageBase64,
      instruction,
      jsonSchema: DIAGNOSIS_SCHEMA,
    });
  } catch (err) {
    // Jeśli OpenRouter nieskonfigurowany lub się wywalił, stubby response żeby UI nie padł
    const msg = String(err);
    if (msg.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Diagnoza z kamery wymaga skonfigurowania OpenRouter (OPENROUTER_API_KEY w env). Załóż konto na openrouter.ai, gotowe w 2 min.',
          configRequired: 'OPENROUTER_API_KEY',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Parsowanie JSON z fallbackiem
  let diagnosis: Record<string, unknown> | null = null;
  try {
    // Strip markdown code fences jeśli są
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    diagnosis = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      {
        error: 'AgroAgent zwrócił niepoprawny JSON',
        rawResponse: rawResponse.slice(0, 500),
      },
      { status: 502 },
    );
  }

  // Log event
  const farmSelect = await prisma.farm.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (farmSelect) {
    await prisma.event.create({
      data: {
        farmId: farmSelect.id,
        type: 'diagnosis.camera',
        title: `Diagnoza z kamery: ${String(diagnosis?.diagnoza ?? 'nieznana')}`,
        detail: JSON.stringify({
          fieldId: parsed.data.fieldId,
          note: parsed.data.note,
          diagnosis,
        }),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    fieldContext,
    diagnosis,
  });
}
