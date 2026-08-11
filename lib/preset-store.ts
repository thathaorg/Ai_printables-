import { PRESETS, type Preset, type PresetOption } from "./presets";

// Merges built-in presets (lib/presets.ts) with CMS presets created in the
// admin panel (stored in the CmsPreset table). A CMS entry with the same id
// as a built-in overrides it; a disabled CMS entry hides it.

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("./prisma");
  return prisma;
}

export function validatePresetConfig(raw: any): { preset?: Preset; error?: string } {
  if (!raw || typeof raw !== "object") return { error: "Config must be an object" };
  const id = String(raw.id ?? "").trim();
  if (!/^[a-z0-9_]{3,40}$/.test(id)) return { error: "id must be 3-40 chars of a-z, 0-9, _" };
  const title = String(raw.title ?? "").trim();
  if (!title) return { error: "Title is required" };
  const promptTemplate = String(raw.promptTemplate ?? "").trim();
  if (promptTemplate.length < 20) return { error: "Prompt template is too short" };

  if (!Array.isArray(raw.options) || raw.options.length === 0) {
    return { error: "At least one option is required" };
  }
  const options: PresetOption[] = [];
  for (const o of raw.options) {
    const key = String(o?.key ?? "").trim();
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,30}$/.test(key)) return { error: `Option key "${key}" is invalid` };
    const values = Array.isArray(o?.values) ? o.values.map((v: any) => String(v).trim()).filter(Boolean) : [];
    if (values.length === 0) return { error: `Option "${key}" needs at least one value` };
    options.push({
      key,
      label: String(o?.label ?? key).trim() || key,
      values,
      allowCustom: !!o?.allowCustom,
      default: o?.default ? String(o.default) : values[0],
    });
  }

  // every {placeholder} in the template must have a matching option
  const placeholders = [...promptTemplate.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const keys = new Set(options.map((o) => o.key));
  const missing = placeholders.filter((p) => !keys.has(p));
  if (missing.length > 0) {
    return { error: `Template uses {${missing[0]}} but there is no option with key "${missing[0]}"` };
  }

  return {
    preset: {
      id,
      title,
      emoji: String(raw.emoji ?? "📄").slice(0, 8),
      description: String(raw.description ?? "").slice(0, 200),
      promptTemplate,
      options,
      tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
    },
  };
}

export async function getAllPresets(): Promise<Preset[]> {
  const merged = new Map<string, Preset>(PRESETS.map((p) => [p.id, p]));
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.cmsPreset.findMany();
      for (const row of rows) {
        if (!row.enabled) {
          merged.delete(row.presetId);
          continue;
        }
        const { preset } = validatePresetConfig(row.config);
        if (preset) merged.set(row.presetId, { ...preset, id: row.presetId });
      }
    } catch (err) {
      console.warn("CMS preset load failed, using built-ins:", err);
    }
  }
  return [...merged.values()];
}

export async function getPresetById(id: string): Promise<Preset | undefined> {
  const all = await getAllPresets();
  return all.find((p) => p.id === id);
}
