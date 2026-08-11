import { PDFDocument } from "pdf-lib";

// A4 in PDF points (72 dpi)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/**
 * Wrap a worksheet image (data URL or fetchable URL, JPEG or PNG) into a
 * single-page A4 PDF with print margins. Returns raw PDF bytes.
 */
export async function imageToA4Pdf(imageUrl: string, title: string): Promise<Uint8Array> {
  // Relative URLs are our bundled fallback worksheet (SVG can't be embedded
  // by pdf-lib, so we draw the pre-approved fallback natively instead)
  if (imageUrl.startsWith("/")) {
    return fallbackPdf(title);
  }

  let bytes: Uint8Array;
  let isPng = false;

  if (imageUrl.startsWith("data:")) {
    const [meta, b64] = imageUrl.split(",");
    isPng = meta.includes("png");
    bytes = Uint8Array.from(Buffer.from(b64, "base64"));
  } else {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch worksheet image (${res.status})`);
    const contentType = res.headers.get("content-type") ?? "";
    isPng = contentType.includes("png");
    bytes = new Uint8Array(await res.arrayBuffer());
  }

  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setProducer("KIWIZ – AI Printables");

  const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);

  const margin = 18; // ~6mm print margin
  const maxW = A4_WIDTH - margin * 2;
  const maxH = A4_HEIGHT - margin * 2;
  const scale = Math.min(maxW / image.width, maxH / image.height);
  const w = image.width * scale;
  const h = image.height * scale;

  page.drawImage(image, {
    x: (A4_WIDTH - w) / 2,
    y: (A4_HEIGHT - h) / 2,
    width: w,
    height: h,
  });

  return doc.save();
}

/** Pre-approved fallback: a simple sun & flower coloring page drawn natively. */
async function fallbackPdf(title: string): Promise<Uint8Array> {
  const { rgb, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const line = { borderColor: black, borderWidth: 4, color: undefined as any };

  page.drawText("Name: ____________", { x: 40, y: A4_HEIGHT - 50, size: 16, font, color: black });
  page.drawText("Date: ______", { x: A4_WIDTH - 160, y: A4_HEIGHT - 50, size: 16, font, color: black });

  // sun
  page.drawCircle({ x: 460, y: A4_HEIGHT - 170, size: 55, ...line });
  const rays: [number, number, number, number][] = [
    [460, A4_HEIGHT - 100, 460, A4_HEIGHT - 75],
    [460, A4_HEIGHT - 240, 460, A4_HEIGHT - 265],
    [385, A4_HEIGHT - 170, 360, A4_HEIGHT - 170],
    [535, A4_HEIGHT - 170, 560, A4_HEIGHT - 170],
  ];
  for (const [x1, y1, x2, y2] of rays) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 4, color: black });
  }

  // flower petals + center
  const cx = 220;
  const cy = A4_HEIGHT - 480;
  page.drawCircle({ x: cx, y: cy, size: 50, ...line });
  const petals: [number, number][] = [
    [cx, cy + 95], [cx, cy - 95], [cx - 95, cy], [cx + 95, cy],
    [cx - 70, cy + 70], [cx + 70, cy + 70], [cx - 70, cy - 70], [cx + 70, cy - 70],
  ];
  for (const [px, py] of petals) {
    page.drawEllipse({ x: px, y: py, xScale: 40, yScale: 40, ...line });
  }

  // stem
  page.drawLine({ start: { x: cx, y: cy - 145 }, end: { x: cx, y: 80 }, thickness: 5, color: black });
  page.drawEllipse({ x: cx - 55, y: 220, xScale: 50, yScale: 22, ...line });
  page.drawEllipse({ x: cx + 55, y: 160, xScale: 50, yScale: 22, ...line });

  return doc.save();
}
