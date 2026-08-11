import { getAllPresets } from "@/lib/preset-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/presets — the preset catalog for the /create studio.
 * Prompt templates stay server-side (PRD: we do the prompting for them,
 * behind the scenes) — only options metadata is exposed.
 */
export async function GET() {
  const presets = await getAllPresets();
  return Response.json({
    presets: presets.map(({ promptTemplate, ...pub }) => pub),
  });
}
