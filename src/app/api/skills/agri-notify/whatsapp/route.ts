import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';
import { fetchWithTimeout } from '@/lib/satellite/http';

const bodySchema = z.object({
  message: z.string().min(1).max(1600),
  field_id: z.string().uuid().optional(), // jeśli powiązane z polem, zapisz rec
});

/**
 * Agent woła to narzędzie żeby wysłać pilne powiadomienie rolnikowi.
 * MVP: zapisujemy w DB, sent_via_whatsapp=false. Faza 5: faktyczna wysyłka
 * przez Meta Business Cloud API.
 */
export async function POST(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const farm = await prisma.farm.findUnique({
    where: { id: auth.farmId },
    include: { user: true },
  });
  if (!farm) return NextResponse.json({ error: 'Farm not found' }, { status: 404 });

  await prisma.event.create({
    data: {
      farmId: farm.id,
      type: 'whatsapp.outgoing',
      title: 'Powiadomienie WhatsApp (queued)',
      detail: parsed.data.message,
    },
  });

  // Jeśli field_id → zapisz też jako Recommendation history.
  // WAŻNE: weryfikujemy, że pole należy do farmy z tokenu (auth.farmId), inaczej
  // wołający mógłby wstrzyknąć rekomendację do CUDZEGO pola (IDOR na zapis). Audyt 2.2.
  if (parsed.data.field_id) {
    const field = await prisma.field.findFirst({
      where: { id: parsed.data.field_id, farmId: farm.id },
      select: { id: true },
    });
    if (!field) {
      return NextResponse.json(
        { error: 'Field not found in this farm' },
        { status: 404 },
      );
    }
    await prisma.recommendation.create({
      data: {
        fieldId: field.id,
        severity: 'medium',
        title: 'Alert od agenta',
        message: parsed.data.message,
        action: parsed.data.message,
        sentViaWhatsapp: false, // zmieni się kiedy Meta API wyśle
      },
    });
  }

  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
  const userPhone = farm.user.phoneNumber;

  if (!whatsappToken || !whatsappPhoneId || !userPhone) {
    // MVP: queued only — pokaż w /dashboard/events
    return NextResponse.json({
      status: 'queued',
      reason: !userPhone
        ? 'Rolnik nie ma numeru telefonu w profilu'
        : 'WhatsApp Business API nieskonfigurowane',
      message: parsed.data.message,
    });
  }

  // Real send przez Meta Cloud API
  const res = await fetchWithTimeout(
    `https://graph.facebook.com/v21.0/${whatsappPhoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: userPhone,
        type: 'text',
        text: { body: parsed.data.message },
      }),
      timeoutMs: 15_000,
      retries: 0, // POST /messages nieidempotentny — bez retry, by nie dublować wiadomości
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    await prisma.event.create({
      data: {
        farmId: farm.id,
        type: 'whatsapp.error',
        title: 'WhatsApp wysyłka nieudana',
        detail: errText,
      },
    });
    return NextResponse.json({ status: 'failed', error: errText }, { status: 502 });
  }

  return NextResponse.json({ status: 'sent' });
}
