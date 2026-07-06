// WhatsApp Business Cloud API — inbound webhook (flagowa funkcja AgriClaw).
// Rolnik pisze na WhatsApp → wiadomość trafia tutaj → routujemy do agenta AI
// jego gospodarstwa (OpenClaw) → odpowiedź wraca na WhatsApp.
//
// GET  — weryfikacja webhooka przez Meta (hub.challenge).
// POST — przychodzące wiadomości. Weryfikacja podpisu X-Hub-Signature-256 (HMAC).
//
// Konfiguracja (env): WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_TOKEN,
// WHATSAPP_PHONE_ID. Ścieżka /api/whatsapp/* jest publiczna (poza matcherem
// middleware) — Meta woła ją bez sesji, dlatego chronimy ją podpisem HMAC.

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@/lib/prisma';
import { OpenClawClient } from '@/lib/openclaw';
import { buildAgriclawSystemPrompt } from '@/lib/openclaw-prompt';
import { withAdvisoryDisclaimer } from '@/lib/advisory';
import { runAgroAgent } from '@/lib/agent/agro-agent';
import { fetchWithTimeout } from '@/lib/satellite/http';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ── GET: weryfikacja webhooka (Meta wysyła raz przy konfiguracji) ────────────
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get('hub.mode');
  const token = p.get('hub.verify_token');
  const challenge = p.get('hub.challenge') ?? '';
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && expected && token === expected) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ── POST: przychodzące wiadomości ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Weryfikacja podpisu HMAC (Meta podpisuje ciało kluczem app secret).
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sig = req.headers.get('x-hub-signature-256') ?? '';
    const expected = 'sha256=' + createHmac('sha256', appSecret).update(raw).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return new Response('Invalid signature', { status: 401 });
    }
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ ok: true }); // ignoruj śmieci, nie każ Meta ponawiać
  }

  const message = extractFirstTextMessage(body);
  if (message) {
    // Meta wymaga szybkiego 200 i ponawia przy braku — przetwarzamy po odpowiedzi.
    waitUntil(handleInbound(message).catch((err) => console.error('WhatsApp inbound:', err)));
  }

  return NextResponse.json({ ok: true });
}

// ── Typy webhooka (minimalny podzbiór) ───────────────────────────────────────
interface WebhookBody {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
        contacts?: Array<{ profile?: { name?: string } }>;
      };
    }>;
  }>;
}

interface InboundMessage {
  from: string; // numer nadawcy (bez +, np. 48601234567)
  text: string;
}

function extractFirstTextMessage(body: WebhookBody): InboundMessage | null {
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const msg = change.value?.messages?.[0];
      if (msg?.type === 'text' && msg.from && msg.text?.body) {
        return { from: msg.from, text: msg.text.body };
      }
    }
  }
  return null;
}

// Normalizacja numeru do samych cyfr — Meta wysyła '48601...', w bazie może być
// '+48 601...' itp. Porównujemy po ostatnich 9 cyfrach (krajowy numer PL).
function phoneDigits(v: string): string {
  return v.replace(/\D/g, '');
}

async function handleInbound(msg: InboundMessage): Promise<void> {
  const digits = phoneDigits(msg.from);
  const last9 = digits.slice(-9);

  // Wymagamy pełnego krajowego numeru (9 cyfr) — inaczej endsWith na krótkim/pustym
  // ciągu mógłby dopasować CUDZE konto. Krótkie numery (shortcode) ignorujemy.
  if (last9.length < 9) {
    console.warn('WhatsApp: numer nadawcy za krótki do dopasowania, pomijam.');
    return;
  }

  // Znajdź użytkownika po numerze (dopasowanie po końcówce 9 cyfr krajowych).
  const users = await prisma.user.findMany({
    where: { phoneNumber: { not: null } },
    select: { id: true, phoneNumber: true },
  });
  const matches = users.filter(
    (u) => u.phoneNumber && phoneDigits(u.phoneNumber).slice(-9) === last9,
  );
  // Dokładnie jedno dopasowanie — przy niejednoznaczności nie routujemy do nikogo.
  const user = matches.length === 1 ? matches[0] : null;

  if (!user) {
    await sendWhatsappText(
      msg.from,
      'Ten numer nie jest powiązany z kontem AgriClaw. Załóż konto na agriclaw-tau.vercel.app i dodaj numer w Ustawieniach, aby rozmawiać z agentem.',
    );
    return;
  }

  const farm = await prisma.farm.findFirst({
    where: { userId: user.id, suspended: false },
    include: {
      fields: { where: { deletedAt: null }, select: { id: true, name: true, crop: true, areaHectares: true } },
      agents: { where: { status: 'READY' }, orderBy: { createdAt: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!farm) {
    await sendWhatsappText(msg.from, 'Nie znaleziono aktywnego gospodarstwa. Zaloguj się na AgriClaw i dodaj pole.');
    return;
  }

  const agent = farm.agents[0];

  // Brak agenta OpenClaw → wbudowany AgroAgent v2 (MiniMax). Rolnik z Beta 100
  // rozmawia na WhatsApp od pierwszej sekundy, bez stawiania VM.
  if (!agent || !agent.serverIp) {
    if (!process.env.MINIMAX_API_KEY) {
      await sendWhatsappText(
        msg.from,
        'Czat AI jest chwilowo niedostępny (konfiguracja w toku). Spróbuj później.',
      );
      return;
    }
    const sessionKey = `agro:wa:${farm.id}`;
    const conversation =
      (await prisma.conversation.findFirst({ where: { farmId: farm.id, sessionKey } })) ??
      (await prisma.conversation.create({
        data: { farmId: farm.id, engine: 'agroagent', sessionKey, title: 'WhatsApp' },
      }));
    const past = await prisma.message.findMany({
      where: { conversationId: conversation.id, role: { in: ['USER', 'ASSISTANT'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true },
    });
    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'USER', content: msg.text },
    });
    const result = await runAgroAgent({
      farmId: farm.id,
      ctx: {
        farmId: farm.id,
        farmName: farm.name,
        address: farm.address,
        fields: farm.fields.map((f) => ({ id: f.id, name: f.name, crop: f.crop, areaHectares: f.areaHectares })),
      },
      history: past
        .reverse()
        .map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }) as import('@/lib/ai/minimax').LlmMessage),
      userMessage: msg.text,
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: result.content,
        metadata: JSON.stringify({ engine: 'agroagent', channel: 'whatsapp', model: result.model }),
      },
    });
    await sendWhatsappText(msg.from, result.content);
    return;
  }

  // Zapisz/znajdź konwersację WhatsApp dla tej farmy (ścieżka OpenClaw).
  const sessionKey = `agriclaw:wa:${farm.id}`;
  const conversation =
    (await prisma.conversation.findFirst({ where: { farmId: farm.id, sessionKey } })) ??
    (await prisma.conversation.create({
      data: { farmId: farm.id, agentId: agent.id, sessionKey, title: 'WhatsApp' },
    }));

  await prisma.message.create({
    data: { agentId: agent.id, conversationId: conversation.id, role: 'USER', content: msg.text },
  });

  const systemPrompt = buildAgriclawSystemPrompt({
    farmId: farm.id,
    farmName: farm.name,
    address: farm.address,
    fields: farm.fields.map((f) => ({ id: f.id, name: f.name, crop: f.crop, areaHectares: f.areaHectares })),
  });

  const client = new OpenClawClient(agent.serverIp, agent.gatewayPort, agent.gatewayToken ?? undefined);
  const result = await client.runAgentStream(
    `${systemPrompt}\n\n---\n\nRolnik pyta (WhatsApp): ${msg.text}`,
    [],
    conversation.sessionKey,
    () => {}, // brak streamingu na WhatsApp — bierzemy pełną odpowiedź
    undefined,
  );

  // Twardy bezpiecznik ŚOR — zalecenie ochrony roślin bez odwołania do etykiety
  // dostaje doklejone zastrzeżenie (wsparcie decyzji, nie polecenie).
  const reply =
    result.success && result.output
      ? withAdvisoryDisclaimer(result.output)
      : 'Przepraszam, chwilowo nie mogę odpowiedzieć. Spróbuj ponownie za chwilę.';

  if (result.success && result.output) {
    await prisma.message.create({
      data: {
        agentId: agent.id,
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: reply,
        metadata: JSON.stringify({ channel: 'whatsapp', model: result.model, tokensUsed: result.tokensUsed }),
      },
    });
  }

  await sendWhatsappText(msg.from, reply);
}

async function sendWhatsappText(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.warn('WhatsApp: brak WHATSAPP_TOKEN/PHONE_ID — nie mogę odpowiedzieć.');
    return;
  }
  // WhatsApp limit tekstu to 4096 znaków.
  const body = text.slice(0, 4096);
  // retries:0 — POST /messages NIE jest idempotentny; retry przy timeoucie po
  // udanej dostawie wysłałby duplikat do rolnika.
  const res = await fetchWithTimeout(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    timeoutMs: 15_000,
    retries: 0,
  });
  if (!res.ok) {
    console.error('WhatsApp send failed:', res.status, await res.text().catch(() => ''));
  }
}
