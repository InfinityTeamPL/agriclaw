// POST /api/cron/sor-sync — import rejestru ŚOR (MRiRW) z dane.gov.pl.
// Idempotentny po releaseLabel (bezpieczny przy codziennym wywołaniu z cron/daily).
// Auth: wyłącznie Bearer CRON_SECRET (timing-safe) — jak pozostałe crony.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { syncSorRegistry } from '@/lib/sor-registry';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // import ~3 tys. produktów + ~18 tys. zastosowań

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // ?force=1 — pomija guard spadku liczności i idempotencję (recovery po złym
    // wydaniu); absolutne minima sanity nadal obowiązują.
    const force = req.nextUrl.searchParams.get('force') === '1';
    const result = await syncSorRegistry({ force });
    return NextResponse.json(result);
  } catch (err) {
    console.error('sor-sync:', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
