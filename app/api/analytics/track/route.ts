import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANON_COOKIE } from "@/lib/kiwiz-config";

export const dynamic = "force-dynamic";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

/**
 * POST /api/analytics/track — funnel events (no auth).
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const prisma = await getPrisma();
    if (!prisma) {
      return NextResponse.json({ success: true, warning: "Database not configured" });
    }

    const cookieStore = await cookies();
    const anonId = cookieStore.get(ANON_COOKIE)?.value ?? null;

    if (typeof data?.event === "string") {
      await prisma.trackedEvent.create({
        data: {
          name: data.event.slice(0, 80),
          props: data.props ?? undefined,
          bridgeId: data.bridgeId ?? null,
          utmSource: data.utmSource ?? null,
          utmMedium: data.utmMedium ?? null,
          utmCampaign: data.utmCampaign ?? null,
          anonId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 });
  }
}
