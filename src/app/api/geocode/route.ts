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
  let result;
  try {
    result = await geocodeAddress(parsed.data.address);
  } catch (err) {
    console.error('[geocode] usługa adresowa niedostępna', err);
    return NextResponse.json(
      { error: 'Wyszukiwarka adresów chwilowo nie odpowiada. Spróbuj ponownie za chwilę.' },
      { status: 502 },
    );
  }
  if (!result) {
    return NextResponse.json(
      { error: 'Nie znaleziono takiego adresu. Wpisz miejscowość i województwo, np. Włocławek, kujawsko-pomorskie.' },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
