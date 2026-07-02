// Helpery sesji dla AgriClaw — uproszczona wersja wzorca clawlabspro
// requireAuth → current user z redirect do /login
// requireFarm → aktywne gospodarstwo z redirect do /onboarding

import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export const requireAuth = cache(async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  if (!user) redirect('/login');

  return {
    user,
    isAdmin: isAdmin(user.email),
  };
});

export const requireFarm = cache(async function requireFarm() {
  const { user } = await requireAuth();

  const farm = await prisma.farm.findFirst({
    where: { userId: user.id, suspended: false },
    include: {
      fields: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      agents: { where: { status: { not: 'DELETED' } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!farm) redirect('/onboarding');

  return { user, farm };
});

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });
}
