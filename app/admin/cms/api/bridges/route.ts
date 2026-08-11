import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { BRIDGES } from "@/lib/bridges";
import { validateBridgeConfig } from "@/lib/bridge-store";

export const dynamic = "force-dynamic";

/** GET — all bridge pages: built-ins (read-only) + CMS rows */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { prisma } = auth.context;

  const rows = await prisma.cmsBridge.findMany({ orderBy: { updatedAt: "desc" } });
  const cmsIds = new Set(rows.map((r) => r.bridgeId));

  return NextResponse.json({
    builtIn: BRIDGES.filter((b) => !cmsIds.has(b.bridgeId)),
    cms: rows.map((r) => ({
      id: r.id,
      bridgeId: r.bridgeId,
      enabled: r.enabled,
      config: r.config,
      updatedAt: r.updatedAt,
    })),
  });
}

/** POST — create or update a bridge page from the admin form */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { prisma } = auth.context;

  const body = await req.json();
  const { bridge, error } = validateBridgeConfig(body);
  if (!bridge) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const row = await prisma.cmsBridge.upsert({
    where: { bridgeId: bridge.bridgeId },
    update: { config: bridge as object, enabled: true },
    create: { bridgeId: bridge.bridgeId, config: bridge as object },
  });

  return NextResponse.json({ success: true, id: row.id, bridgeId: row.bridgeId });
}
