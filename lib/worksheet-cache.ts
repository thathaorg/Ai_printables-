import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type CachedWorksheet = {
  dataUrl: string;
  mimeType: string;
  hitCount: number;
};

function diskRoot(): string | null {
  const dir = process.env.WORKSHEET_CACHE_DIR?.trim();
  return dir && dir.length > 0 ? dir : null;
}

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  const { prisma } = await import("./prisma");
  return prisma;
}

/** Parse data: or https image into raw bytes + mime. */
export async function imageUrlToBytes(
  imageUrl: string
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  try {
    if (imageUrl.startsWith("data:")) {
      const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(imageUrl);
      if (!match) return null;
      return { mimeType: match[1], bytes: Buffer.from(match[2], "base64") };
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/png";
      const ab = await res.arrayBuffer();
      return { mimeType, bytes: Buffer.from(ab) };
    }

    return null;
  } catch {
    return null;
  }
}

function toDataUrl(bytes: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function fileNameFor(hash: string, mimeType: string): string {
  const ext =
    mimeType.includes("jpeg") || mimeType.includes("jpg")
      ? "jpg"
      : mimeType.includes("webp")
        ? "webp"
        : "png";
  return `${hash}.${ext}`;
}

/**
 * Load a full-quality cached worksheet by prompt hash.
 * Quality is never recompressed on read — original stored bytes are returned.
 */
export async function getCachedWorksheet(promptHash: string): Promise<CachedWorksheet | null> {
  const prisma = await getPrisma();
  if (!prisma) return null;

  try {
    const row = await prisma.worksheetCache.findUnique({ where: { promptHash } });
    if (!row) return null;

    let bytes: Buffer | null = null;

    if (row.filePath) {
      try {
        bytes = await readFile(row.filePath);
      } catch {
        // Fall through to DB bytes or miss
      }
    }

    if (!bytes && row.imageData) {
      bytes = Buffer.from(row.imageData);
    }

    if (!bytes || bytes.length === 0) return null;

    await prisma.worksheetCache.update({
      where: { promptHash },
      data: { hitCount: { increment: 1 } },
    });

    return {
      dataUrl: toDataUrl(bytes, row.mimeType),
      mimeType: row.mimeType,
      hitCount: row.hitCount + 1,
    };
  } catch (err) {
    console.warn("worksheet cache read failed:", err);
    return null;
  }
}

/**
 * Store a full-quality worksheet after a successful AI + safety pass.
 * Prefers disk (WORKSHEET_CACHE_DIR) for VPS scale; otherwise Neon Bytes.
 */
export async function putCachedWorksheet(input: {
  promptHash: string;
  preset: string;
  options: Record<string, string>;
  imageUrl: string;
}): Promise<boolean> {
  const prisma = await getPrisma();
  if (!prisma) return false;

  // Never cache fallback SVG / relative paths
  if (
    !input.imageUrl.startsWith("data:") &&
    !input.imageUrl.startsWith("http")
  ) {
    return false;
  }

  const parsed = await imageUrlToBytes(input.imageUrl);
  if (!parsed || parsed.bytes.length < 500) return false;

  const { bytes, mimeType } = parsed;
  let filePath: string | null = null;
  let imageData: Uint8Array | null = new Uint8Array(bytes);

  const root = diskRoot();
  if (root) {
    try {
      await mkdir(root, { recursive: true });
      const dest = path.join(root, fileNameFor(input.promptHash, mimeType));
      await writeFile(dest, new Uint8Array(bytes));
      filePath = dest;
      // Keep a thin DB row on disk cache to avoid double storage
      imageData = null;
    } catch (err) {
      console.warn("worksheet disk cache write failed, using DB:", err);
      filePath = null;
      imageData = new Uint8Array(bytes);
    }
  }

  try {
    await prisma.worksheetCache.upsert({
      where: { promptHash: input.promptHash },
      create: {
        promptHash: input.promptHash,
        preset: input.preset,
        options: input.options,
        mimeType,
        filePath,
        imageData,
        hitCount: 0,
      },
      update: {
        mimeType,
        filePath,
        imageData,
        options: input.options,
        preset: input.preset,
      },
    });
    return true;
  } catch (err) {
    console.warn("worksheet cache write failed:", err);
    return false;
  }
}

/** Integrity helper for tests/admin later. */
export function contentFingerprint(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}
