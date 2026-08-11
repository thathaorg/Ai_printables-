import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/** Admin cookie name — set after password login, verified by shared secret. */
export const ADMIN_COOKIE = "kiwiz_admin";

function adminSecret(): string | null {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || null;
}

export function signAdminToken(): string | null {
  const secret = adminSecret();
  if (!secret) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`kiwiz-admin:${day}`).digest("hex");
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = signAdminToken();
  if (!expected) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function checkAdminPassword(password: string): boolean {
  const secret = adminSecret();
  if (!secret) return false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(secret);
    if (a.length !== b.length) {
      // still compare hashes to reduce timing leaks slightly
      const ha = createHmac("sha256", "x").update(password).digest();
      const hb = createHmac("sha256", "x").update(secret).digest();
      timingSafeEqual(ha, hb);
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Server components / API routes: is current request an admin? */
export async function isAdminSession(): Promise<boolean> {
  if (!adminSecret()) return false;
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

export type AdminContext = {
  prisma: import("@prisma/client").PrismaClient;
};

export async function requireAdmin(): Promise<
  { context: AdminContext; response?: never } | { context?: never; response: NextResponse }
> {
  if (!(await isAdminSession())) {
    return {
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      response: NextResponse.json({ error: "Database not configured" }, { status: 503 }),
    };
  }

  const { prisma } = await import("@/lib/prisma");
  return { context: { prisma } };
}
