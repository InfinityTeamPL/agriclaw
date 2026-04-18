// GET /api/import/parcel?teryt=XXX — pobiera działkę z GUGiK ULDK
// GET /api/import/parcel?lat=X&lon=Y — znajduje działkę pod współrzędnymi

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import {
  fetchParcelByTeryt,
  fetchParcelByCoords,
} from '@/lib/satellite/gugik-uldk';

export async function GET(req: NextRequest) {
  await requireAuth();
  const sp = req.nextUrl.searchParams;
  const teryt = sp.get('teryt');
  const lat = sp.get('lat');
  const lon = sp.get('lon');

  try {
    if (teryt) {
      const result = await fetchParcelByTeryt(teryt);
      if (!result) {
        return NextResponse.json(
          { error: 'Działka nie znaleziona. Sprawdź numer TERYT.' },
          { status: 404 },
        );
      }
      return NextResponse.json(result);
    }
    if (lat && lon) {
      const result = await fetchParcelByCoords(Number(lat), Number(lon));
      if (!result) {
        return NextResponse.json({ error: 'Brak działki pod tą pozycją' }, { status: 404 });
      }
      return NextResponse.json(result);
    }
    return NextResponse.json(
      { error: 'Podaj teryt=XXX albo lat=X&lon=Y' },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err).slice(0, 200) },
      { status: 502 },
    );
  }
}
