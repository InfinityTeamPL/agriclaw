// Seed script dla AgriClaw — tworzy demo usera + przykładowe gospodarstwo z jednym polem.
// Uruchom: `npx tsx prisma/seed.ts`
// Login: demo@agriclaw.pl / demo1234

import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@agriclaw.pl';
  const password = 'demo1234';

  const hashed = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
      name: 'Demo Rolnik',
      emailVerified: true,
    },
  });

  console.log(`✓ User: ${user.email}`);

  // Gospodarstwo we Włocławku. Idempotentnie: wcześniejszy upsert po id=user.id nigdy nie trafiał
  // w istniejący rekord, więc każde uruchomienie seeda zakładało NOWE gospodarstwo.
  const farm =
    (await prisma.farm.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })) ??
    (await prisma.farm.create({
      data: {
        userId: user.id,
        name: 'Demo Gospodarstwo',
        address: 'Włocławek, Polska',
        lat: 52.6482,
        lon: 19.0678,
        apiKey: `agri_${crypto.randomBytes(24).toString('hex')}`,
        plan: 'free',
      },
    }));

  console.log(`✓ Farm: ${farm.name} (${farm.id})`);

  // Pole ~5 ha na gruntach ornych na południe od Włocławka (pas pod uprawą, zweryfikowany na
  // zdjęciu lotniczym). Wcześniejszy prostokąt leżał na zabudowie miejskiej i miał ~26 ha,
  // choć w bazie stało 5,12 — powierzchnię liczymy teraz z geometrii.
  const polygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [19.013825, 52.55125],
        [19.015425, 52.55125],
        [19.015625, 52.547],
        [19.014025, 52.547],
        [19.013825, 52.55125],
      ],
    ],
  };

  // Idempotentnie: kolejne uruchomienie seeda nie dokłada duplikatu pola.
  const existingField = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "fields"
    WHERE farm_id = ${farm.id} AND name = 'Pole za stodołą' AND deleted_at IS NULL
    LIMIT 1
  `;
  if (existingField.length === 0) {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "fields" (id, farm_id, name, crop, area_hectares, polygon, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${farm.id},
          'Pole za stodołą',
          'wheat',
          ROUND((ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(polygon)}), 4326)::geography) / 10000.0)::numeric, 2),
          ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(polygon)}), 4326),
          NOW(),
          NOW()
        )
      `,
    );
  }

  console.log(`✓ Field: Pole za stodołą (pszenica, ok. 5,1 ha)`);

  console.log('\nZaloguj się na:');
  console.log(`   Email:    ${email}`);
  console.log(`   Hasło:    ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
