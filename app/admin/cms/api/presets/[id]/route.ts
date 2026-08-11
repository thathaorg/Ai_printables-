import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** PATCH — toggle a CMS preset on/off */
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { prisma } = auth.context;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  try {
    const row = await prisma.cmsPreset.update({
      where: { id },
      data: { enabled: !!body.enabled },
    });
    return NextResponse.json({ success: true, enabled: row.enabled });
  } catch (err) {
    console.error("CMS preset toggle failed:", err);
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
}

/** DELETE — remove a CMS preset */
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { prisma } = auth.context;
  const { id } = await params;

  try {
    await prisma.cmsPreset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CMS preset delete failed:", err);
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
}
