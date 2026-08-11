import { CREDITS } from "./kiwiz-config";

// Server-enforced daily generation credits, keyed by logged-in user id or by
// the anonymous cookie id (with IP as a weak fallback). Stored in Postgres so
// limits survive serverless instance recycling.

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("./prisma");
  return prisma;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CreditCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/** Check and consume one credit atomically. */
export async function consumeCredit(key: string, isLoggedIn: boolean): Promise<CreditCheck> {
  const limit = isLoggedIn ? CREDITS.loggedInPerDay : CREDITS.anonymousPerDay;
  const prisma = await getPrisma();
  const day = todayUtc();

  if (!prisma) {
    // No DB configured (local misconfig): fall back to allowing, generation
    // itself will still fail loudly if the AI key is missing.
    return { allowed: true, remaining: limit - 1, limit };
  }

  const usage = await prisma.dailyUsage.upsert({
    where: { key_day: { key, day } },
    update: {},
    create: { key, day, count: 0 },
  });

  if (usage.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  const updated = await prisma.dailyUsage.update({
    where: { key_day: { key, day } },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: Math.max(0, limit - updated.count), limit };
}

export async function remainingCredits(key: string, isLoggedIn: boolean): Promise<CreditCheck> {
  const limit = isLoggedIn ? CREDITS.loggedInPerDay : CREDITS.anonymousPerDay;
  const prisma = await getPrisma();
  if (!prisma) return { allowed: true, remaining: limit, limit };
  const usage = await prisma.dailyUsage.findUnique({
    where: { key_day: { key, day: todayUtc() } },
  });
  const used = usage?.count ?? 0;
  return { allowed: used < limit, remaining: Math.max(0, limit - used), limit };
}
