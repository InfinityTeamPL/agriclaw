// Zod schemas dla AgriClaw API
// Walidacja wszystkich POST/PATCH endpointów

import { z } from 'zod';

export const polygonSchema = z
  .object({
    type: z.literal('Polygon'),
    coordinates: z
      .array(
        z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])),
      )
      .min(1),
  })
  .refine(
    (poly) => poly.coordinates[0].length >= 4,
    'Polygon musi mieć min 4 punkty (z zamknięciem)',
  );

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

export const updateFieldSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  crop: cropSchema.optional(),
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
  image: z.string().startsWith('data:image/').optional(), // opcjonalnie base64 z kamery
});

export const geocodeSchema = z.object({
  address: z.string().min(3).max(500),
});

export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type DeployAgentInput = z.infer<typeof deployAgentSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
