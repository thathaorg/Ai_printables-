import { syncContactToEsp } from "@/lib/esp";

export const dynamic = "force-dynamic";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/lead — the email gate (PRD).
 * Records the lead in our CRM with funnel tags + consent, and mirrors it to
 * the configured ESP. Body:
 * { email, preset?, topic?, age?, style?, bridge?, utmSource?, utmMedium?, utmCampaign? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: "invalid_email" }, { status: 400 });
    }

    const lead = {
      email,
      preset: body?.preset ?? null,
      topic: body?.topic ?? null,
      age: body?.age ?? null,
      style: body?.style ?? null,
      bridgeId: body?.bridge ?? null,
      utmSource: body?.utmSource ?? null,
      utmMedium: body?.utmMedium ?? null,
      utmCampaign: body?.utmCampaign ?? null,
      consentTos: true, // submitting the gate form records consent (free printable by email + TOS/Privacy)
    };

    const prisma = await getPrisma();
    if (prisma) {
      await prisma.lead.create({ data: lead });
    }

    // Mirror to ESP with segmentation tags
    const tags = [
      lead.preset && `preset:${lead.preset}`,
      lead.topic && `topic:${lead.topic}`,
      lead.age && `age:${lead.age}`,
      lead.style && `style:${lead.style}`,
      lead.bridgeId && `bridge:${lead.bridgeId}`,
      lead.utmSource && `utm_source:${lead.utmSource}`,
      lead.utmCampaign && `utm_campaign:${lead.utmCampaign}`,
    ].filter(Boolean) as string[];

    await syncContactToEsp({ email, tags });

    return Response.json({ success: true });
  } catch (error) {
    console.error("lead error:", error);
    return Response.json({ error: "lead_failed" }, { status: 500 });
  }
}
