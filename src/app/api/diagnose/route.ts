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
  "rozpoznanaUprawa": "co widzisz na zdjęciu: pszenica | kukurydza | rzepak | jęczmień | ziemniaki | inna (nazwa)",
  "fazaRozwoju": "krótki opis fazy: np. 'wczesna wegetacja, BBCH 20-30'",
  "diagnoza": "TWOJA NAJBARDZIEJ PRAWDOPODOBNA DIAGNOZA po polsku (nawet przy niskiej pewności — wymień top 1-2 możliwości). Jeśli widzisz coś nietypowego/podejrzanego — OPISZ co widzisz konkretnie ('liście żółknące od brzegów', 'plamki brązowe średnicy 2-5 mm', etc)",
  "pewnosc": "wysoka | średnia | niska",
  "typProblemu": "choroba_grzybowa | szkodnik | niedobor | chwast | herbicyd | mechaniczne | stres_wodny | stres_termiczny | brak_problemu | inne",
  "objawy": ["konkretne obserwacje z obrazu, np. 'plamy chlorotyczne na górnych liściach', 'zwinięcie brzegów liścia', 'żerowanie larwy na nerwie liścia'"],
  "rekomendacja": {
    "pilnosc": "pilne | w_ciagu_tygodnia | monitoruj",
    "akcja": "konkretna akcja — co zrobić DZIŚ",
    "srodki": [
      { "typ": "fungicyd | herbicyd | insektycyd | nawoz | inne", "substancja_czynna": "pełna nazwa", "przyklad_handlowy": "nazwa handlowa PL (np. Falcon 460 EC)", "dawka": "z etykiety, np. 0.6 l/ha" }
    ],
    "okno_oprysku": "np. jutro rano 5:30-9:00, bez wiatru >15 km/h"
  },
  "porada_dodatkowa": "np. gdzie jeszcze się rozejrzeć, co obserwować w następnych dniach"
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
        deletedAt: null,
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

  const instruction = `Jesteś doświadczonym agronomem z 20-letnim stażem w polskich gospodarstwach. Oglądasz zdjęcie z pola. ${cropHint} ${userNoteHint}

ZADANIE:
1. **Zidentyfikuj uprawę** którą widzisz (nawet jeśli różni się od tej co rolnik zadeklarował — powiedz mu!)
2. **Określ fazę rozwojową** (BBCH lub opis: wschody/krzewienie/strzelanie/kwitnienie/dojrzewanie)
3. **Diagnozuj co widzisz** — nawet jeśli nie ma oczywistego problemu, to:
   - zauważ RZECZY NORMALNE ("zdrowe zielone liście, pokrycie łanu ~90%")
   - jeśli widzisz COKOLWIEK nietypowego (przebarwienie, plamka, chwast na brzegu, zagęszczenie) — OPISZ dokładnie co widać
   - NIE odpowiadaj "brak problemów" bez sprawdzenia min 3 rzeczy: kolor liści, struktura, obecność szkodników, chwastów, uszkodzeń
4. **Daj najbardziej prawdopodobną diagnozę** — nawet przy niskiej pewności wymień top 1-2 możliwości. Rolnik woli dowiedzieć się "może być septoria albo plamistość siatkowa" niż "nie wiem".
5. **Konkretna rekomendacja**: nazwa handlowa ŚOR zarejestrowanego w Polsce (MRiRW), dawka z etykiety, okno oprysku.

Jeśli zdjęcie faktycznie jest zbyt słabe/dalekie — zwróć fazy rozwoju i uprawy + powiedz "zrób zbliżenie liścia 20-30 cm od rośliny" w poradzie_dodatkowa.

Unikaj generycznych rad typu "stosuj fungicyd". Podaj KONKRET: substancja czynna + nazwa handlowa + dawka.`;

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

  // Walidacja treści: pusta {} albo brak kluczowego pola `diagnoza` to NIE sukces
  // (model odpowiedział niczym). Wcześniej zwracaliśmy ok:true z diagnosis:{}. Audyt (live).
  if (
    !diagnosis ||
    typeof diagnosis !== 'object' ||
    Object.keys(diagnosis).length === 0 ||
    !diagnosis.diagnoza
  ) {
    return NextResponse.json(
      {
        error:
          'AgroAgent nie rozpoznał zawartości zdjęcia. Zrób ostrzejsze zbliżenie liścia (20-30 cm) w dobrym świetle i spróbuj ponownie.',
        rawResponse: rawResponse.slice(0, 300),
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
