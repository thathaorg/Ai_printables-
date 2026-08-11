import { cookies } from "next/headers";
import { buildPrompt } from "@/lib/presets";
import { getPresetById } from "@/lib/preset-store";
import { generateImageWithOpenRouter } from "@/lib/image-generation";
import { isTopicSafe, isImageKidSafe } from "@/lib/safety";
import { consumeCredit, remainingCredits } from "@/lib/credits";
import { ANON_COOKIE } from "@/lib/kiwiz-config";
import { worksheetPromptHash } from "@/lib/prompt-hash";
import { getCachedWorksheet, putCachedWorksheet } from "@/lib/worksheet-cache";

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
 * Smart path: identical options → full-quality cache ($0, no safety re-pay).
 * Miss → full AI quality once → store → next time free.
 * Credits only apply to cold (AI) generations, not cache hits.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const preset = await getPresetById(body?.preset);
    if (!preset) {
      return Response.json({ error: "unknown_preset" }, { status: 400 });
    }

    const { prompt, options } = buildPrompt(preset, body?.options ?? {});

    for (const value of Object.values(options)) {
      if (!isTopicSafe(value)) {
        return Response.json(
          {
            error: "safety_blocked",
            message: "That topic isn't suitable for a kids' worksheet. Try another one!",
          },
          { status: 422 }
        );
      }
    }

    const cookieStore = await cookies();
    let anonId = cookieStore.get(ANON_COOKIE)?.value;
    let setAnonCookie = false;
    if (!anonId) {
      anonId = crypto.randomUUID();
      setAnonCookie = true;
    }

    const creditKey = `anon:${anonId}`;
    const promptHash = worksheetPromptHash(preset.id, options, preset.promptTemplate);

    // ── 1) Durable full-quality cache (primary money saver) ──
    const cached = await getCachedWorksheet(promptHash);
    if (cached) {
      const credits = await remainingCredits(creditKey, false);
      const generationId = await persistGeneration({
        preset: preset.id,
        options,
        prompt,
        promptHash,
        status: "cache_hit",
        anonId,
        bridgeId: body?.bridge ?? null,
      });

      return withAnonCookie(
        Response.json({
          success: true,
          generationId,
          imageUrl: cached.dataUrl,
          preset: preset.id,
          options,
          tags: preset.tags,
          remaining: credits.remaining,
          limit: credits.limit,
          fallback: false,
          cached: true,
          promptHash,
        }),
        setAnonCookie,
        anonId
      );
    }

    // ── 2) Cold path: daily credit + paid AI ──
    const credit = await consumeCredit(creditKey, false);
    if (!credit.allowed) {
      return Response.json(
        {
          error: "limit_reached",
          message: `You've used all ${credit.limit} free worksheets for today. Come back tomorrow!`,
          remaining: 0,
          limit: credit.limit,
          loggedIn: false,
        },
        { status: 403 }
      );
    }

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
      imageUrl = FALLBACK_IMAGE;
      if (status !== "safety_blocked") status = "failed_fallback";
    }

    // Store only real, safe AI images (never fallback) for forever reuse
    if (status === "succeeded" && imageUrl !== FALLBACK_IMAGE) {
      await putCachedWorksheet({
        promptHash,
        preset: preset.id,
        options,
        imageUrl,
      });
    }

    const generationId = await persistGeneration({
      preset: preset.id,
      options,
      prompt,
      promptHash,
      status,
      anonId,
      bridgeId: body?.bridge ?? null,
    });

    return withAnonCookie(
      Response.json({
        success: true,
        generationId,
        imageUrl,
        preset: preset.id,
        options,
        tags: preset.tags,
        remaining: credit.remaining,
        limit: credit.limit,
        fallback: imageUrl === FALLBACK_IMAGE,
        cached: false,
        promptHash,
      }),
      setAnonCookie,
      anonId
    );
  } catch (error) {
    console.error("generate error:", error);
    return Response.json({ error: "generation_failed" }, { status: 500 });
  }
}

async function persistGeneration(data: {
  preset: string;
  options: Record<string, string>;
  prompt: string;
  promptHash: string;
  status: string;
  anonId: string;
  bridgeId: string | null;
}): Promise<string | null> {
  const prisma = await getPrisma();
  if (!prisma) return null;
  try {
    const gen = await prisma.generation.create({
      data: {
        preset: data.preset,
        options: data.options,
        prompt: data.prompt,
        promptHash: data.promptHash,
        // Bytes live in WorksheetCache; generation row is audit/funnel only
        imageUrl: data.status === "cache_hit" ? `cache:${data.promptHash}` : null,
        status: data.status,
        anonId: data.anonId,
        email: null,
        bridgeId: data.bridgeId,
      },
    });
    return gen.id;
  } catch (err) {
    console.warn("Failed to persist generation:", err);
    return null;
  }
}

function withAnonCookie(res: Response, set: boolean, anonId: string): Response {
  if (set) {
    res.headers.append(
      "Set-Cookie",
      `${ANON_COOKIE}=${anonId}; Path=/; Max-Age=31536000; SameSite=Lax`
    );
  }
  return res;
}
