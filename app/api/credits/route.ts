import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { remainingCredits } from "@/lib/credits";
import { ANON_COOKIE } from "@/lib/kiwiz-config";

export const dynamic = "force-dynamic";

/** GET remaining free generations for the anonymous cookie (no consume). */
export async function GET() {
  const jar = await cookies();
  let anonId = jar.get(ANON_COOKIE)?.value;
  let setCookie = false;
  if (!anonId) {
    anonId = crypto.randomUUID();
    setCookie = true;
  }
  const credits = await remainingCredits(`anon:${anonId}`, false);
  const res = NextResponse.json({
    remaining: credits.remaining,
    limit: credits.limit,
    used: Math.max(0, credits.limit - credits.remaining),
  });
  if (setCookie) {
    res.cookies.set(ANON_COOKIE, anonId, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }
  return res;
}
