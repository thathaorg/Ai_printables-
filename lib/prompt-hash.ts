import { createHash } from "crypto";

/**
 * Bump when global generation policy changes (e.g. safety defaults)
 * so old assets are not reused after a quality/policy change.
 */
export const WORKSHEET_CACHE_VERSION = "1";

/** Stable hash of preset + options + template so identical worksheets share one asset. */
export function worksheetPromptHash(
  presetId: string,
  options: Record<string, string>,
  promptTemplate: string
): string {
  const sortedOptions = Object.keys(options)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = String(options[key] ?? "").trim();
      return acc;
    }, {});

  const templateFingerprint = createHash("sha256")
    .update(promptTemplate)
    .digest("hex")
    .slice(0, 24);

  const payload = JSON.stringify({
    v: WORKSHEET_CACHE_VERSION,
    presetId,
    options: sortedOptions,
    template: templateFingerprint,
  });

  return createHash("sha256").update(payload).digest("hex");
}
