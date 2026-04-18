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

  // Gospodarstwo we Włocławku
  const farm = await prisma.farm.upsert({
    where: { id: user.id }, // nie istnieje więc utworzy
    update: {},
    create: {
      userId: user.id,
      name: 'Demo Gospodarstwo',
      address: 'Włocławek, Polska',
      lat: 52.6482,
      lon: 19.0678,
      apiKey: `agri_${crypto.randomBytes(24).toString('hex')}`,
      plan: 'free',
    },
  }).catch(async () => {
    const existing = await prisma.farm.findFirst({ where: { userId: user.id } });
    if (existing) return existing;
    return prisma.farm.create({
      data: {
        userId: user.id,
        name: 'Demo Gospodarstwo',
        address: 'Włocławek, Polska',
        lat: 52.6482,
        lon: 19.0678,
        apiKey: `agri_${crypto.randomBytes(24).toString('hex')}`,
        plan: 'free',
      },
    });
  });

  console.log(`✓ Farm: ${farm.name} (${farm.id})`);

  // Pole o powierzchni ok. 5 ha koło Włocławka
  const polygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [19.065, 52.645],
        [19.072, 52.645],
        [19.072, 52.65],
        [19.065, 52.65],
        [19.065, 52.645],
      ],
    ],
  };

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "fields" (id, farm_id, name, crop, area_hectares, polygon, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${farm.id},
        'Pole za stodołą',
        'wheat',
        5.12,
        ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(polygon)}), 4326),
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
    `,
  );

  console.log(`✓ Field: Pole za stodołą (pszenica, 5.12 ha)`);

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
