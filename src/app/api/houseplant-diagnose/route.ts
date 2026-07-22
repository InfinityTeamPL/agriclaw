// POST /api/houseplant-diagnose — diagnoza roślin domowych/doniczkowych z kamery.
//
// Osobno od /api/diagnose (uprawy polowe): inny kontekst i inne ryzyko.
// Rośliny domowe NIE używają rejestru ŚOR MRiRW (to pestycydy rolnicze) —
// tu liczą się pielęgnacja (podlewanie/światło/wilgotność/przesadzanie) i
// DOMOWE, bezpieczne metody na szkodniki (mydło potasowe, olej neem,
// izopropanol na wełnowce, żółte tablice na ziemiórki), a nie oprysk polowy.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getOpenRouterClient } from '@/lib/ai/openrouter';

const bodySchema = z.object({
  imageBase64: z.string().startsWith('data:image/'),
  note: z.string().max(500).optional(),
});

const HOUSEPLANT_SCHEMA = `{
  "roslina": "rozpoznany gatunek po polsku + łacińska nazwa jeśli pewna, np. 'Monstera dziurawa (Monstera deliciosa)'. Jeśli nie masz pewności — podaj najbliższą grupę ('roślina z rodziny obrazkowatych, prawdopodobnie filodendron')",
  "pewnosc": "wysoka | średnia | niska",
  "stanOgolny": "zdrowa | lekko osłabiona | wyraźnie chora",
  "typProblemu": "przelanie | niedolanie | zle_swiatlo | szkodnik | choroba_grzybowa | niedobor | za_sucho_powietrze | potrzeba_przesadzenia | poparzenie_sloneczne | normalne | inne",
  "diagnoza": "najbardziej prawdopodobna przyczyna po polsku — przy niskiej pewności wymień top 1-2 możliwości. Jeśli roślina wygląda zdrowo, napisz to wprost i wskaż co utrzymać",
  "objawy": ["konkretne obserwacje ze zdjęcia, np. 'brązowe, suche końcówki liści', 'biały nalot w kątach liści', 'przędza/pajęczynka pod spodem liścia'"],
  "pielegnacja": {
    "podlewanie": "konkretnie, np. 'gdy górne 3-4 cm podłoża przeschną — latem ~raz/tydzień, zimą rzadziej. Nie zostawiaj wody w podstawce'",
    "swiatlo": "np. 'jasne rozproszone; unikaj ostrego słońca w południe'",
    "wilgotnosc": "np. 'lubi >50% — zimą zraszaj lub postaw na podstawce z keramzytem i wodą'",
    "temperatura": "np. '18-24°C; chroń przed przeciągiem i grzejnikiem'",
    "nawozenie": "np. 'nawóz do roślin zielonych co 2 tygodnie w sezonie III-IX, zimą nie nawoź'"
  },
  "rekomendacja": {
    "pilnosc": "pilne | w_ciagu_tygodnia | obserwuj",
    "akcja": "co zrobić — konkretnie i DOMOWYMI sposobami (nie polecaj środków rolniczych/ŚOR)",
    "domoweSrodki": [
      { "metoda": "nazwa metody, np. 'Mydło potasowe (szare) na przędziorki'", "jak": "krótka instrukcja domowa", "kiedy": "np. 'co 5-7 dni, 3 zabiegi'" }
    ]
  },
  "porada_dodatkowa": "np. 'odizoluj od innych roślin', 'sprawdź spód liści i pachwiny', 'przy przesadzaniu użyj świeżego podłoża'",
  "kiedy_do_eksperta": "krótko: kiedy warto pójść do sklepu ogrodniczego lub gdy domowe metody nie pomagają"
}`;

export async function POST(req: NextRequest) {
  const { user } = await requireAuth();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userNoteHint = parsed.data.note
    ? `Dodatkowy kontekst od właściciela: „${parsed.data.note}"`
    : '';

  const instruction = `Jesteś doświadczonym specjalistą od roślin domowych i doniczkowych (nie rolnikiem — to mieszkanie, nie pole). Oglądasz zdjęcie rośliny pokojowej. ${userNoteHint}

ZADANIE:
1. **Rozpoznaj gatunek** rośliny (nazwa polska + łacińska, jeśli pewna). Jeśli nie masz pewności — podaj najbliższą grupę.
2. **Oceń stan** i **zdiagnozuj** co widać. Najczęstsze przyczyny problemów roślin domowych to: PRZELANIE (nr 1 zabójca — gnijące korzenie, żółknięcie, miękkie łodygi), niedolanie, złe światło (za mało/poparzenie słońcem), za suche powietrze (brązowe końcówki), szkodniki (przędziorki — pajęczynka i drobne kropki; mączliki — białe muszki; wełnowce — biały „wacik" w pachwinach; ziemiórki — małe muszki nad ziemią), potrzeba przesadzenia (korzenie wychodzą dołem).
3. Jeśli roślina jest zdrowa — powiedz to wprost i wskaż, co utrzymać.
4. **Plan pielęgnacji** dopasowany do gatunku: podlewanie, światło, wilgotność, temperatura, nawożenie — konkretnie.
5. **Rekomendacja DOMOWYMI metodami** — NIE polecaj środków ochrony roślin rolniczych (ŚOR/fungicydów polowych). Zamiast tego: mydło potasowe/szare, olej neem, izopropanol na patyczku (wełnowce), przemywanie liści/prysznic, żółte tablice lepowe + przesuszenie podłoża (ziemiórki), izolacja od innych roślin, przesadzenie w świeże podłoże, korekta podlewania.

Pisz ciepło i po ludzku, jak do kogoś kto lubi swoje rośliny, ale bez lania wody. Konkret > ogólniki. Jeśli zdjęcie jest zbyt słabe/dalekie — powiedz w porada_dodatkowa „zrób ostrzejsze zbliżenie liścia i spodu blaszki".`;

  let rawResponse: string;
  try {
    const client = getOpenRouterClient();
    rawResponse = await client.analyzeSatelliteImage({
      imageUrl: parsed.data.imageBase64,
      instruction,
      jsonSchema: HOUSEPLANT_SCHEMA,
    });
  } catch (err) {
    const msg = String(err);
    if (msg.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        {
          error:
            'Diagnoza z kamery wymaga skonfigurowania OpenRouter (OPENROUTER_API_KEY w env).',
          configRequired: 'OPENROUTER_API_KEY',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  let diagnosis: Record<string, unknown> | null = null;
  try {
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    diagnosis = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: 'Model zwrócił niepoprawny JSON', rawResponse: rawResponse.slice(0, 500) },
      { status: 502 },
    );
  }

  // Pusta odpowiedź / brak diagnozy to NIE sukces (jak w /api/diagnose — audyt).
  if (
    !diagnosis ||
    typeof diagnosis !== 'object' ||
    Object.keys(diagnosis).length === 0 ||
    !diagnosis.diagnoza
  ) {
    return NextResponse.json(
      {
        error:
          'Nie rozpoznałem rośliny na zdjęciu. Zrób ostrzejsze zbliżenie liścia (i jego spodu) w dobrym świetle i spróbuj ponownie.',
        rawResponse: rawResponse.slice(0, 300),
      },
      { status: 502 },
    );
  }

  // Log event (osobny typ — nie miesza się z diagnozą polową).
  const farmSelect = await prisma.farm.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (farmSelect) {
    await prisma.event.create({
      data: {
        farmId: farmSelect.id,
        type: 'diagnosis.houseplant',
        title: `Diagnoza rośliny domowej: ${String(diagnosis?.roslina ?? diagnosis?.diagnoza ?? 'nieznana')}`,
        detail: JSON.stringify({ note: parsed.data.note, diagnosis }),
      },
    });
  }

  return NextResponse.json({ ok: true, diagnosis });
}
