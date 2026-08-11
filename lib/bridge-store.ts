import { BRIDGES, type BridgeConfig, type BridgeTemplate, type BridgeQuizStep } from "./bridges";

// Merges built-in bridge pages (lib/bridges.ts) with CMS bridges created in
// the admin panel (CmsBridge table).

const TEMPLATES: BridgeTemplate[] = [
  "offer",
  "letter_picker",
  "number_picker",
  "theme_picker",
  "age_gate",
  "mini_quiz",
  "teacher",
];

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("./prisma");
  return prisma;
}

export function validateBridgeConfig(raw: any): { bridge?: BridgeConfig; error?: string } {
  if (!raw || typeof raw !== "object") return { error: "Config must be an object" };
  const bridgeId = String(raw.bridgeId ?? "").trim();
  if (!/^[a-z0-9_-]{3,50}$/.test(bridgeId)) {
    return { error: "Bridge ID must be 3-50 chars of a-z, 0-9, _ or -" };
  }
  const template = String(raw.template ?? "") as BridgeTemplate;
  if (!TEMPLATES.includes(template)) {
    return { error: `Template must be one of: ${TEMPLATES.join(", ")}` };
  }
  const headline = String(raw.headline ?? "").trim();
  if (!headline) return { error: "Headline is required" };

  const payload: Record<string, string> = {};
  if (raw.payload && typeof raw.payload === "object") {
    for (const [k, v] of Object.entries(raw.payload)) {
      if (/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(k)) payload[k] = String(v).slice(0, 60);
    }
  }
  if (!payload.preset) {
    return { error: "Payload must include a preset (which worksheet the visitor lands on)" };
  }

  const needsOptions =
    template === "theme_picker" ||
    template === "age_gate" ||
    template === "teacher";
  const options = Array.isArray(raw.options)
    ? raw.options.map((v: any) => String(v).trim()).filter(Boolean)
    : [];
  if (needsOptions && options.length === 0) {
    return { error: "This template needs at least one option for visitors to pick" };
  }

  let quizSteps: BridgeQuizStep[] | undefined;
  if (template === "mini_quiz") {
    if (Array.isArray(raw.quizSteps) && raw.quizSteps.length > 0) {
      quizSteps = raw.quizSteps.map((s: any) => ({
        question: String(s.question ?? "").slice(0, 120),
        options: Array.isArray(s.options)
          ? s.options.map((o: any) => String(o).trim()).filter(Boolean).slice(0, 12)
          : [],
        payloadKey: String(s.payloadKey ?? "").trim(),
      })).filter((s: BridgeQuizStep) => s.question && s.payloadKey && s.options.length > 0);
    }
    if (!quizSteps?.length) {
      return { error: "Mini quiz needs quizSteps (question + options + payloadKey)" };
    }
  }

  const needsPayloadKey =
    template !== "offer" && template !== "mini_quiz";
  const payloadKey = raw.payloadKey ? String(raw.payloadKey).trim() : undefined;
  if (needsPayloadKey && !payloadKey) {
    return { error: "Choose which /create field the visitor's pick fills (payload key)" };
  }

  return {
    bridge: {
      bridgeId,
      template,
      headline,
      subline: String(raw.subline ?? "").slice(0, 200),
      cta: String(raw.cta ?? "Get my free printable").slice(0, 60),
      options: needsOptions ? options : undefined,
      payloadKey: needsPayloadKey ? payloadKey : undefined,
      payload,
      emoji: String(raw.emoji ?? "✨").slice(0, 8),
      quizSteps,
    },
  };
}

export async function getAllBridges(): Promise<BridgeConfig[]> {
  const merged = new Map<string, BridgeConfig>(BRIDGES.map((b) => [b.bridgeId, b]));
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.cmsBridge.findMany();
      for (const row of rows) {
        if (!row.enabled) {
          merged.delete(row.bridgeId);
          continue;
        }
        const { bridge } = validateBridgeConfig(row.config);
        if (bridge) merged.set(row.bridgeId, { ...bridge, bridgeId: row.bridgeId });
      }
    } catch (err) {
      console.warn("CMS bridge load failed, using built-ins:", err);
    }
  }
  return [...merged.values()];
}

export async function getBridgeById(bridgeId: string): Promise<BridgeConfig | undefined> {
  const all = await getAllBridges();
  return all.find((b) => b.bridgeId === bridgeId);
}
