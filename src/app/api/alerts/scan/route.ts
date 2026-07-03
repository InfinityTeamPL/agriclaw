// POST /api/alerts/scan — skanuje WSZYSTKIE pola gospodarstwa pod kątem:
//  - przymrozków (frost)
//  - upałów (heat)
//  - chorób grzybowych (diseases)
//  - deficytu wodnego (water balance)
// Każde z powyższych ma już własny endpoint który auto-tworzy Recommendation
// w DB gdy wykryje zagrożenie. Tutaj po prostu równolegle je odpalamy dla każdego pola.

import { NextRequest, NextResponse } from 'next/server';
import { requireFarm } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { farm } = await requireFarm();

  // Ciasteczko sesji wołającego (dashboard) — MUSIMY je przekazać do wewnętrznych
  // wywołań, inaczej requireAuth w /frost,/heat,... robi redirect na /login (307),
  // fetch podąża za nim, dostaje 200 (HTML logowania) i skan raportuje FAŁSZYWY
  // sukces nie tworząc żadnych rekomendacji. (audyt: skaner „nic nie robi").
  const cookie = req.headers.get('cookie') ?? '';

  const fields = await prisma.field.findMany({
    where: { farmId: farm.id, deletedAt: null },
    select: { id: true, name: true },
  });

  const startTime = Date.now();
  const scans: Array<{ fieldId: string; endpoint: string; ok: boolean; error?: string }> = [];

  // Wewnętrzne wywołanie własnego endpointu — odciążamy heavy-lift (Open-Meteo)
  // i korzystamy z auto-Recommendation wbudowanego w /frost, /heat, /diseases.
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const endpoints = ['frost', 'heat', 'diseases', 'water-balance'];

  // Rejestrujemy event żeby było wiadomo że skanowanie było
  await prisma.event.create({
    data: {
      farmId: farm.id,
      type: 'alerts.scan.started',
      title: `Skan pól (${fields.length})`,
      detail: `Sprawdzanie: ${endpoints.join(', ')}`,
    },
  });

  // Wywołaj endpointy równolegle per pole. Używamy Promise.allSettled żeby 1 błąd nie zabił całości.
  const tasks: Promise<void>[] = [];
  for (const field of fields) {
    for (const endpoint of endpoints) {
      tasks.push(
        fetch(`${origin}/api/fields/${field.id}/${endpoint}`, {
          method: 'GET',
          headers: { 'x-internal-scan': '1', cookie },
          // Nie podążaj za redirectem na /login — traktuj brak autoryzacji jako
          // porażkę, nie fałszywy sukces (opaqueredirect → res.ok === false).
          redirect: 'manual',
        })
          .then((res) => {
            scans.push({ fieldId: field.id, endpoint, ok: res.ok });
          })
          .catch((err) => {
            scans.push({
              fieldId: field.id,
              endpoint,
              ok: false,
              error: String(err?.message ?? err),
            });
          }),
      );
    }
  }

  await Promise.allSettled(tasks);

  // Zlicz powstałe Recommendation (stworzono w ciągu scanu)
  const fresh = await prisma.recommendation.count({
    where: {
      field: { farmId: farm.id },
      createdAt: { gt: new Date(startTime - 1000) },
    },
  });

  return NextResponse.json({
    farmId: farm.id,
    fieldsScanned: fields.length,
    endpointsPerField: endpoints.length,
    totalChecks: scans.length,
    failures: scans.filter((s) => !s.ok).length,
    newRecommendations: fresh,
    durationMs: Date.now() - startTime,
  });
}
