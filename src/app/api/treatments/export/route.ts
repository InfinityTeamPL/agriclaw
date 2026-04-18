// GET /api/treatments/export?format=csv — eksport księgi polowej
// Format zgodny z wymogami IJHARS / ARiMR (do ewentualnej kontroli).

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { user } = await requireAuth();
  const format = req.nextUrl.searchParams.get('format') ?? 'csv';
  const fieldId = req.nextUrl.searchParams.get('fieldId');

  const rows = await prisma.$queryRaw<
    Array<{
      field_name: string;
      field_crop: string;
      area_hectares: number;
      performed_at: Date;
      type: string;
      purpose: string | null;
      product_name: string;
      active_substance: string | null;
      registration_no: string | null;
      dose_value: number | null;
      dose_unit: string | null;
      area_treated: number;
      water_volume: number | null;
      operator_name: string | null;
      equipment: string | null;
      weather_temp: number | null;
      weather_wind: number | null;
      weather_humidity: number | null;
      pre_harvest_interval_days: number | null;
      notes: string | null;
    }>
  >`
    SELECT f.name AS field_name, f.crop AS field_crop, f.area_hectares,
           t.performed_at, t.type, t.purpose,
           t.product_name, t.active_substance, t.registration_no,
           t.dose_value, t.dose_unit, t.area_treated, t.water_volume,
           t.operator_name, t.equipment,
           t.weather_temp, t.weather_wind, t.weather_humidity,
           t.pre_harvest_interval_days, t.notes
    FROM "treatments" t
    JOIN "fields" f ON f.id = t.field_id
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE fa.user_id = ${user.id}
      ${fieldId ? prismaSafeFieldFilter(fieldId) : prismaEmptyFragment()}
    ORDER BY t.performed_at DESC
  `;

  if (format === 'csv') {
    const header = [
      'Pole',
      'Uprawa',
      'Powierzchnia pola (ha)',
      'Data zabiegu',
      'Typ zabiegu',
      'Cel',
      'Produkt',
      'Substancja czynna',
      'Nr zezwolenia',
      'Dawka',
      'Jednostka',
      'Powierzchnia obrobiona (ha)',
      'Woda (l/ha)',
      'Operator',
      'Sprzęt',
      'Temp (°C)',
      'Wiatr (km/h)',
      'Wilgotność (%)',
      'Karencja (dni)',
      'Uwagi',
    ];
    const rowsCsv = rows.map((r) =>
      [
        r.field_name,
        r.field_crop,
        Number(r.area_hectares).toFixed(2),
        r.performed_at.toISOString().slice(0, 10),
        r.type,
        r.purpose ?? '',
        r.product_name,
        r.active_substance ?? '',
        r.registration_no ?? '',
        r.dose_value ?? '',
        r.dose_unit ?? '',
        Number(r.area_treated).toFixed(2),
        r.water_volume ?? '',
        r.operator_name ?? '',
        r.equipment ?? '',
        r.weather_temp ?? '',
        r.weather_wind ?? '',
        r.weather_humidity ?? '',
        r.pre_harvest_interval_days ?? '',
        (r.notes ?? '').replace(/"/g, '""').replace(/\n/g, ' '),
      ]
        .map((v) => `"${String(v)}"`)
        .join(','),
    );
    const csv = [header.map((h) => `"${h}"`).join(','), ...rowsCsv].join('\r\n');
    const filename = `ksiega-polowa-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({
    user: user.email,
    generatedAt: new Date().toISOString(),
    count: rows.length,
    treatments: rows,
  });
}

// Helpers: Prisma.sql nie exportowane bezpośrednio, obejście:
function prismaSafeFieldFilter(fieldId: string) {
  // Prisma chroni przed SQL injection używając parameterized queries
  // w tagged template literal. Tu tworzymy "puste" fragment jeśli brak
  // fieldId, a jeśli jest — dokładamy AND.
  // Używamy `Prisma.sql` poprzez import dynamiczny bo statyczny wymaga helperów.
  // Uproszczenie: uuid już zwalidowany przez Zod gdzie indziej; dla bezpieczeństwa
  // wymuszamy format uuid.
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(fieldId)) return prismaEmptyFragment();
  const { Prisma } = require('@prisma/client');
  return Prisma.sql`AND t.field_id = ${fieldId}`;
}

function prismaEmptyFragment() {
  const { Prisma } = require('@prisma/client');
  return Prisma.empty;
}
