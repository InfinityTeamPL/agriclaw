// Public health check — dla monitoringów, Vercel deploy smoke test.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      service: 'agriclaw',
      db: 'connected',
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    // Publiczny endpoint: szczegóły (host bazy, komunikat Prismy) tylko do logów, nie do odpowiedzi.
    console.error('[health] baza niedostępna', err);
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'agriclaw',
        db: 'error',
      },
      { status: 503 },
    );
  }
}
