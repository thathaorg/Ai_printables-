import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NEWSLETTER_LISTS } from "@/lib/kiwiz-config";
import { syncContactToEsp } from "@/lib/esp";

export const dynamic = "force-dynamic";

async function getPrisma() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured. Newsletter subscribe API unavailable.");
    return null;
  }
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const VALID_LIST_IDS = new Set(NEWSLETTER_LISTS.map((l) => l.id));

/**
 * POST /api/newsletter/subscribe
 * Body: { email, lists?: string[] }
 * PRD: the download unlock requires joining at least one list, so when
 * `lists` is provided it must contain at least one valid list id.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    let lists: string[] | undefined;
    if (Array.isArray(body?.lists)) {
      lists = body.lists.filter((l: string) => VALID_LIST_IDS.has(l));
      if (lists!.length === 0) {
        return Response.json(
          { error: "pick_one", message: "Pick at least one newsletter to join." },
          { status: 400 }
        );
      }
    }

    const prisma = await getPrisma();
    if (!prisma) {
      return Response.json(
        { error: "Service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    let userId: string | undefined;
    try {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (user) {
        const dbUser =
          (await prisma.user.findUnique({ where: { kindeId: user.id } })) ??
          (user.email ? await prisma.user.findUnique({ where: { email: user.email } }) : null);
        if (dbUser) {
          userId = dbUser.id;
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { newsletterSubscribed: true },
          });
        }
      }
    } catch (authError) {
      console.warn("Newsletter subscription: unable to resolve Kinde user", authError);
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    const mergedLists = Array.from(new Set([...(existing?.lists ?? []), ...(lists ?? [])]));

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { userId, lists: mergedLists },
      create: { email, userId, lists: mergedLists },
    });

    await syncContactToEsp({
      email,
      tags: mergedLists.map((l) => `list:${l}`),
      lists: mergedLists,
    });

    return Response.json({ success: true, lists: mergedLists });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return Response.json({ error: "Subscription failed" }, { status: 500 });
  }
}
