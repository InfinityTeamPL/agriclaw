import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

export const requireAuth = cache(async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      tenants: {
        include: {
          tenant: {
            include: {
              // Tombstones (DELETED) are excluded from user-facing
              // reads — they survive for admin audit but should never
              // leak into dashboard counts, agent lists, plan limits.
              agents: { where: { status: { not: "DELETED" } } },
              credits: true,
              tasks: {
                take: 10,
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const tenant = user.tenants[0]?.tenant;
  const credits = tenant
    ? tenant.credits.reduce((sum, c) => sum + (c.amount - c.usedAmount), 0)
    : 0;
  const admin = isAdmin(user.email);

  // Suspended tenant gate — admins bypass
  if (tenant?.suspended && !admin) {
    redirect("/suspended");
  }

  // Token usage data for current period
  let tokensUsed = 0;
  let promptTokensUsed = 0;
  let completionTokensUsed = 0;

  if (tenant) {
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const allUsage = await prisma.usage.findMany({
      where: {
        tenantId: tenant.id,
        periodStart: { gte: periodStart },
      },
    });

    tokensUsed = allUsage.reduce((sum, u) => sum + u.tokensUsed, 0);
    promptTokensUsed = allUsage.reduce((sum, u) => sum + u.promptTokensUsed, 0);
    completionTokensUsed = allUsage.reduce((sum, u) => sum + u.completionTokensUsed, 0);
  }

  return {
    user,
    tenant,
    credits,
    isAdmin: admin,
    subscriptionStatus: tenant?.subscriptionStatus || null,
    subscriptionTier: tenant?.plan || "free",
    subscriptionPeriodEnd: tenant?.subscriptionPeriodEnd || null,
    cancelAtPeriodEnd: tenant?.cancelAtPeriodEnd || false,
    planSource: tenant?.planSource || null,
    planSourceLabel: tenant?.planSourceLabel || null,
    planExpiresAt: tenant?.planExpiresAt || null,
    gracePeriodUntil: tenant?.gracePeriodUntil || null,
    tokensUsed,
    promptTokensUsed,
    completionTokensUsed,
  };
});

export const requireAuthLight = cache(async function requireAuthLight() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      tenants: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              plan: true,
              subscriptionStatus: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const tenant = user.tenants[0]?.tenant;
  const admin = isAdmin(user.email);

  return {
    user,
    tenant,
    isAdmin: admin,
  };
});

export async function requireAdmin() {
  const auth = await requireAuth();
  if (!auth.isAdmin) {
    redirect("/dashboard");
  }
  return auth;
}

/**
 * Ensures user has active subscription. Admins bypass.
 * Non-admin without subscription → try Stripe sync, then redirect to billing.
 */
export async function requireSubscription() {
  const auth = await requireAuth();
  if (!auth.isAdmin) {
    let status = auth.subscriptionStatus;

    // If DB doesn't show active, try syncing from Stripe
    if (status !== "active" && status !== "trialing" && auth.tenant?.stripeCustomerId) {
      try {
        const { syncSubscriptionFromStripe } = await import("@/lib/stripe");
        const synced = await syncSubscriptionFromStripe(
          auth.tenant.stripeCustomerId,
          auth.tenant.id,
          prisma,
        );
        if (synced) {
          status = synced.status;
          auth.subscriptionStatus = synced.status;
          auth.subscriptionTier = synced.tier;
          auth.subscriptionPeriodEnd = synced.periodEnd;
        }
      } catch {
        // Non-critical
      }
    }

    // Grace period: redirect to billing where the user sees the banner
    // and a reactivate CTA. The dashboard is gated until they pay again.
    if (status === "grace") {
      redirect("/dashboard/billing");
    }

    if (status !== "active" && status !== "trialing") {
      redirect("/dashboard/billing");
    }
  }
  return auth;
}
