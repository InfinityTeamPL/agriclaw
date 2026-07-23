// Rośliny domowe — diagnoza z kamery dla kwiatów i roślin doniczkowych.
// Osobna funkcja od diagnozy polowej: bez pól i rejestru ŚOR, z planem
// pielęgnacji i domowymi metodami.

import { requireFarm } from '@/lib/session';
import { HouseplantClient } from './HouseplantClient';

export const dynamic = 'force-dynamic';

export default async function HouseplantsPage() {
  // requireFarm — spójna bramka autoryzacji jak reszta panelu (bez danych pola).
  await requireFarm();
  return <HouseplantClient />;
}
