import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { PRESETS } from "@/lib/presets";
import { validatePresetConfig } from "@/lib/preset-store";

export const dynamic = "force-dynamic";

/** GET — all presets: built-ins (read-only) + CMS rows */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { prisma } = auth.context;

  const rows = await prisma.cmsPreset.findMany({ orderBy: { updatedAt: "desc" } });
  const cmsIds = new Set(rows.map((r) => r.presetId));

  return NextResponse.json({
    builtIn: PRESETS.filter((p) => !cmsIds.has(p.id)),
    cms: rows.map((r) => ({
      id: r.id,
      presetId: r.presetId,
      enabled: r.enabled,
      config: r.config,
      updatedAt: r.updatedAt,
    })),
  });
}

/** POST — create or update a preset from the admin form */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { prisma } = auth.context;

  const body = await req.json();
  const { preset, error } = validatePresetConfig(body);
  if (!preset) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const row = await prisma.cmsPreset.upsert({
    where: { presetId: preset.id },
    update: { config: preset as object, enabled: true },
    create: { presetId: preset.id, config: preset as object },
  });

  return NextResponse.json({ success: true, id: row.id, presetId: row.presetId });
}
