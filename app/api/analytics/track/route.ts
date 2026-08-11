import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { cookies } from "next/headers";
import { ANON_COOKIE } from "@/lib/kiwiz-config";

export const dynamic = "force-dynamic";

async function getPrisma() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured. Analytics tracking disabled.");
    return null;
  }
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

/**
 * POST /api/analytics/track
 * Funnel events (PRD): every event carries bridge ID + UTM + campaign so the
 * chain from ad to subscription never breaks.
 * Body: { event: string, props?: object, bridgeId?, utmSource?, utmMedium?, utmCampaign? }
 * (legacy body { type, duration, prompt, imageUrl } still accepted)
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

    // ---- new funnel events ----
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
      return NextResponse.json({ success: true });
    }

    // ---- legacy session/activity tracking ----
    const { type, duration, prompt, imageUrl } = data;
    const { getUser } = getKindeServerSession();
    const user = await getUser().catch(() => null);

    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { kindeId: user.id } });
      if (dbUser) {
        if (type === "SESSION" && duration) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { totalSessionHours: { increment: duration } },
          });
        }
        if (type === "COLORING" || type === "TRACING") {
          await prisma.activity.create({
            data: {
              type,
              prompt: prompt || "Untitled",
              imageUrl: imageUrl || null,
              userId: dbUser.id,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 });
  }
}
