// GET /api/user/export — pełny eksport danych konta (prawo do przenoszenia danych, RODO art. 20).
// Polityka prywatności obiecuje „pobranie wszystkich danych w formie eksportu".
// Zwraca JSON: profil, gospodarstwa, pola (GeoJSON), odczyty satelitarne, rekomendacje,
// zabiegi, obserwacje (bez zdjęć) i rozmowy z agentem. Bez haseł, kluczy i tokenów.

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { limitUser } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const { user } = await requireAuth();
  const limited = await limitUser(user.id, 'user-export', 3, 60 * 60_000);
  if (limited) return limited;

  const farms = await prisma.farm.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, address: true, lat: true, lon: true, plan: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const farmIds = farms.map((f) => f.id);

  // Pola z geometrią jako GeoJSON (kolumna PostGIS nie jest dostępna przez klienta Prisma).
  const fields = await prisma.$queryRaw<
    Array<{
      id: string;
      farm_id: string;
      name: string;
      crop: string;
      area_hectares: number;
      sowing_date: Date | null;
      deleted_at: Date | null;
      created_at: Date;
      polygon: string;
    }>
  >`
    SELECT f.id, f.farm_id, f.name, f.crop, f.area_hectares, f.sowing_date,
           f.deleted_at, f.created_at, ST_AsGeoJSON(f.polygon)::text AS polygon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.user_id = ${user.id}
    ORDER BY f.created_at ASC
  `;

  const ownField = { field: { farm: { userId: user.id } } };
  const [ndvi, recommendations, treatments, scouting, conversations] = await Promise.all([
    prisma.ndviReading.findMany({ where: ownField, orderBy: { observedAt: 'asc' } }),
    prisma.recommendation.findMany({ where: ownField, orderBy: { createdAt: 'asc' } }),
    prisma.treatment.findMany({ where: ownField, orderBy: { performedAt: 'asc' } }),
    prisma.scouting.findMany({
      where: ownField,
      orderBy: { createdAt: 'asc' },
      // Zdjęcia (base64) pomijamy — eksport miałby setki MB; pozostałe pola zostają.
      select: {
        id: true,
        fieldId: true,
        lat: true,
        lon: true,
        tag: true,
        severity: true,
        note: true,
        aiDiagnosis: true,
        resolvedAt: true,
        createdAt: true,
      },
    }),
    prisma.conversation.findMany({
      where: { farmId: { in: farmIds } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        farmId: true,
        title: true,
        engine: true,
        createdAt: true,
        messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true, createdAt: true } },
      },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    note: 'Eksport danych konta AgriClaw. Zdjęcia z obserwacji nie są dołączone. Pytania: contact@infinityteam.io.',
    profile: {
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    },
    farms,
    fields: fields.map((f) => ({
      id: f.id,
      farmId: f.farm_id,
      name: f.name,
      crop: f.crop,
      areaHectares: f.area_hectares,
      sowingDate: f.sowing_date,
      deletedAt: f.deleted_at,
      createdAt: f.created_at,
      geometry: JSON.parse(f.polygon),
    })),
    ndviReadings: ndvi,
    recommendations,
    treatments,
    scouting,
    conversations,
  };

  const filename = `agriclaw-dane-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
