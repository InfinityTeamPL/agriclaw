// GET /api/skills/agri-sor/check?product=<nazwa>&crop=<kod> — narzędzie agenta.
// Sprawdza produkt w rejestrze ŚOR MRiRW (import z dane.gov.pl) PRZED wskazaniem
// go rolnikowi: status prawny, zastosowania w uprawie, dawka/termin z rejestru,
// link do etykiety. Guardrail zasady „wsparcie decyzji" (lib/advisory.ts).

import { NextRequest, NextResponse } from 'next/server';
import { verifySkillAuth } from '@/lib/skill-auth';
import { checkSorProduct } from '@/lib/sor-registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const product = req.nextUrl.searchParams.get('product')?.trim() ?? '';
  const crop = req.nextUrl.searchParams.get('crop')?.trim() || undefined;
  if (!product) {
    return NextResponse.json(
      { error: 'Podaj ?product=<nazwa handlowa> (opcjonalnie &crop=<kod uprawy>)' },
      { status: 400 },
    );
  }

  try {
    const result = await checkSorProduct(product, crop);
    if (!result.releaseLabel) {
      return NextResponse.json({
        ...result,
        note: 'Rejestr ŚOR nie został jeszcze zaimportowany (cron sor-sync). ' + result.note,
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
