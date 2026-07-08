// Zod schemas dla AgriClaw API
// Walidacja wszystkich POST/PATCH endpointów

import { z } from 'zod';

export const polygonSchema = z
  .object({
    type: z.literal('Polygon'),
    coordinates: z
      .array(
        z
          .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
          .max(10_000, 'Zbyt wiele punktów w pierścieniu poligonu'),
      )
      .min(1)
      .max(50, 'Zbyt wiele pierścieni w poligonie'),
  })
  .refine(
    (poly) => poly.coordinates[0].length >= 4,
    'Polygon musi mieć min 4 punkty (z zamknięciem)',
  )
  .refine((poly) => {
    // Każdy pierścień musi być domknięty: pierwszy punkt == ostatni. Niedomknięty
    // ring wywala ST_GeomFromGeoJSON w PostGIS (nieobsłużony 500). Audyt 2.MEDIUM.
    return poly.coordinates.every((ring) => {
      if (ring.length < 4) return false;
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    });
  }, 'Każdy pierścień poligonu musi być domknięty (pierwszy punkt = ostatni)');

export const cropSchema = z.enum([
  'wheat',
  'corn',
  'rapeseed',
  'barley',
  'potato',
  'rye',
  'oats',
  'sugarbeet',
  'other',
]);

export const createFarmSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(3).max(500),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const createFieldSchema = z.object({
  farmId: z.string().uuid(),
  name: z.string().min(1).max(200),
  polygon: polygonSchema,
  crop: cropSchema,
});

// Data siewu: "YYYY-MM-DD", w rozsądnym zakresie (nie z przyszłości dalekiej,
// nie sprzed dekad). null = wyczyszczenie (powrót do kalendarza). Koercja do
// Date dla Prisma @db.Date.
const sowingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data w formacie RRRR-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return false;
    const now = Date.now();
    const in14d = now + 14 * 86_400_000;
    const threeYearsAgo = now - 3 * 365 * 86_400_000;
    return d.getTime() <= in14d && d.getTime() >= threeYearsAgo;
  }, 'Data siewu musi być z ostatnich 3 lat i nie z odległej przyszłości')
  .transform((s) => new Date(`${s}T00:00:00Z`));

export const updateFieldSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  crop: cropSchema.optional(),
  // nullable → jawne wyczyszczenie daty siewu; optional → brak zmiany
  sowingDate: sowingDateSchema.nullable().optional(),
});

export const deployAgentSchema = z.object({
  farmId: z.string().uuid(),
  channel: z.enum(['WEB', 'WHATSAPP', 'TELEGRAM']).default('WEB'),
  model: z.string().default('claude-sonnet-4-6'),
});

export const chatMessageSchema = z.object({
  farmId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  // Limit ~8 MB na base64 z kamery — chroni przed wyczerpaniem pamięci funkcji.
  image: z.string().startsWith('data:image/').max(8_000_000).optional(),
});

export const geocodeSchema = z.object({
  address: z.string().min(3).max(500),
});

export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type DeployAgentInput = z.infer<typeof deployAgentSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
