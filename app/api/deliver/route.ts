import { imageToA4Pdf } from "@/lib/pdf";
import { sendWorksheetEmail } from "@/lib/transactional-email";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/deliver — unlocks the download after the email gate.
 * Verifies the email has passed the gate (lead recorded + subscribed to at
 * least one list), wraps the worksheet image into an A4 PDF, emails it via
 * the transactional sender, and returns the PDF for immediate download.
 *
 * Body: { email, imageUrl (data: or https:), title, generationId? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const imageUrl = (body?.imageUrl ?? "").toString();
    const title = (body?.title ?? "Kiwiz Worksheet").toString().slice(0, 80);

    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: "invalid_email" }, { status: 400 });
    }
    const isFallback = imageUrl.startsWith("/");
    if (!imageUrl.startsWith("data:image/") && !imageUrl.startsWith("http") && !isFallback) {
      return Response.json({ error: "invalid_image" }, { status: 400 });
    }

    // Gate check: email must have subscribed to >=1 newsletter (PRD order:
    // email -> recommendations -> subscribe -> then download unlocks)
    const prisma = await getPrisma();
    if (prisma) {
      const sub = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (!sub || sub.lists.length === 0) {
        return Response.json(
          { error: "gate_not_passed", message: "Join at least one newsletter to unlock your download." },
          { status: 403 }
        );
      }
    }

    const pdfBytes = await imageToA4Pdf(imageUrl, title);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;

    // Transactional delivery — must arrive in seconds, separate from marketing
    const emailResult = await sendWorksheetEmail({
      to: email,
      worksheetTitle: title,
      pdfBase64,
      filename,
    });

    if (prisma && body?.generationId) {
      try {
        await prisma.generation.update({
          where: { id: body.generationId },
          data: { email },
        });
      } catch {}
    }

    return Response.json({
      success: true,
      filename,
      pdfBase64,
      emailed: emailResult.sent,
      emailReason: emailResult.reason,
    });
  } catch (error) {
    console.error("deliver error:", error);
    return Response.json({ error: "delivery_failed" }, { status: 500 });
  }
}
