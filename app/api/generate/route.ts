import { cookies } from "next/headers";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { buildPrompt } from "@/lib/presets";
import { getPresetById } from "@/lib/preset-store";
import { generateImageWithOpenRouter } from "@/lib/image-generation";
import { isTopicSafe, isImageKidSafe } from "@/lib/safety";
import { consumeCredit } from "@/lib/credits";
import { ANON_COOKIE } from "@/lib/kiwiz-config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const FALLBACK_IMAGE = "/fallback-worksheet.svg";

/**
 * POST /api/generate
 * The single preset pipeline (PRD): options → prompt builder → AI image →
 * safety filter → preview. Every preset flows through here.
 * Body: { preset: string, options: Record<string,string>, bridge?, utm? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const preset = await getPresetById(body?.preset);
    if (!preset) {
      return Response.json({ error: "unknown_preset" }, { status: 400 });
    }

    const { prompt, options } = buildPrompt(preset, body?.options ?? {});

    // Pre-generation safety on custom text values
    for (const value of Object.values(options)) {
      if (!isTopicSafe(value)) {
        return Response.json(
          { error: "safety_blocked", message: "That topic isn't suitable for a kids' worksheet. Try another one!" },
          { status: 422 }
        );
      }
    }

    // ---- credits: 3/day anonymous, 6/day logged in (configurable) ----
    const { getUser } = getKindeServerSession();
    const user = await getUser().catch(() => null);

    const cookieStore = await cookies();
    let anonId = cookieStore.get(ANON_COOKIE)?.value;
    let setAnonCookie = false;
    if (!anonId) {
      anonId = crypto.randomUUID();
      setAnonCookie = true;
    }

    const creditKey = user ? `user:${user.id}` : `anon:${anonId}`;
    const credit = await consumeCredit(creditKey, !!user);
    if (!credit.allowed) {
      return Response.json(
        {
          error: "limit_reached",
          message: user
            ? `You've used all ${credit.limit} free worksheets for today. Come back tomorrow!`
            : `You've used all ${credit.limit} free worksheets for today. Log in to get more, or come back tomorrow!`,
          remaining: 0,
          limit: credit.limit,
          loggedIn: !!user,
        },
        { status: 403 }
      );
    }

    // ---- AI generation with silent retry, then pre-approved fallback ----
    let imageUrl: string | null = null;
    let status = "succeeded";
    for (let attempt = 0; attempt < 2 && !imageUrl; attempt++) {
      const result = await generateImageWithOpenRouter(prompt);
      if (result.success && result.imageUrl && !result.imageUrl.startsWith("/placeholder")) {
        const safe = await isImageKidSafe(result.imageUrl);
        if (safe) {
          imageUrl = result.imageUrl;
        } else {
          status = "safety_blocked";
        }
      }
    }

    if (!imageUrl) {
      // PRD: on safety/generation failure serve a pre-approved fallback
      imageUrl = FALLBACK_IMAGE;
      if (status !== "safety_blocked") status = "failed_fallback";
    }

    // ---- persist generation for analytics/recommendations ----
    let generationId: string | null = null;
    const prisma = await getPrisma();
    if (prisma) {
      try {
        const gen = await prisma.generation.create({
          data: {
            preset: preset.id,
            options,
            prompt,
            imageUrl: imageUrl.startsWith("data:") ? null : imageUrl, // data URLs are too big to store
            status,
            anonId: user ? null : anonId,
            email: user?.email ?? null,
            bridgeId: body?.bridge ?? null,
          },
        });
        generationId = gen.id;
      } catch (err) {
        console.warn("Failed to persist generation:", err);
      }
    }

    const res = Response.json({
      success: true,
      generationId,
      imageUrl,
      preset: preset.id,
      options,
      tags: preset.tags,
      remaining: credit.remaining,
      limit: credit.limit,
      fallback: imageUrl === FALLBACK_IMAGE,
    });

    if (setAnonCookie) {
      res.headers.append(
        "Set-Cookie",
        `${ANON_COOKIE}=${anonId}; Path=/; Max-Age=31536000; SameSite=Lax`
      );
    }
    return res;
  } catch (error) {
    console.error("generate error:", error);
    return Response.json({ error: "generation_failed" }, { status: 500 });
  }
}
