import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { geocodeAddress } from '@/lib/satellite/geocode';
import { geocodeSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  await requireAuth(); // tylko zalogowani mogą geocodować
  const body = await req.json().catch(() => null);
  const parsed = geocodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await geocodeAddress(parsed.data.address);
  if (!result) {
    return NextResponse.json({ error: 'Nie znaleziono adresu' }, { status: 404 });
  }
  return NextResponse.json(result);
}
