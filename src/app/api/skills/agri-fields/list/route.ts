import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySkillAuth } from '@/lib/skill-auth';

export async function GET(req: NextRequest) {
  const auth = verifySkillAuth(req);
  if (!auth.ok || !auth.farmId) {
    return NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  const fields = await prisma.field.findMany({
    where: { farmId: auth.farmId, deletedAt: null },
    select: { id: true, name: true, crop: true, areaHectares: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    farm_id: auth.farmId,
    fields_count: fields.length,
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      area_ha: Number(f.areaHectares.toFixed(2)),
      registered_at: f.createdAt.toISOString(),
    })),
  });
}
