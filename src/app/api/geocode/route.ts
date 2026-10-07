import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { geocodeAddress } from '@/lib/satellite/geocode';
import { geocodeSchema } from '@/lib/schemas';
import { validationError } from '@/lib/http/validation-error';
import { limitUser } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { user } = await requireAuth(); // tylko zalogowani mogą geocodować
  // Nominatim: polityka 1 zapytanie/s na adres IP serwera — nie pozwalamy jednemu kontu go zalać.
  const limited = await limitUser(user.id, 'geocode', 10, 60_000);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const parsed = geocodeSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }
  const result = await geocodeAddress(parsed.data.address);
  if (!result) {
    return NextResponse.json({ error: 'Nie znaleziono adresu' }, { status: 404 });
  }
  return NextResponse.json(result);
}
