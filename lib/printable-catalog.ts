// Visual catalog of Kiwiz printables — real AI sample sheets live in /public/samples.

export interface PrintableKind {
  id: string;
  title: string;
  shortTitle: string;
  blurb: string;
  detail: string;
  ages: string;
  sample: string;
  /** Primary catalog image (real AI sample worksheet) */
  preview: string;
  /** Optional fallback SVG */
  fallbackPreview?: string;
  tint: string;
  accent: string;
  chip: string;
  freeBridge?: string;
}

export const PRINTABLE_KINDS: PrintableKind[] = [
  {
    id: "alphabet_tracing",
    title: "Alphabet Tracing",
    shortTitle: "Letters",
    blurb: "Capital A–Z with guide arrows",
    detail: "Large hollow letter + dashed practice rows. Perfect for crayon or pencil grips.",
    ages: "Ages 2–5",
    sample: "Letter A practice sheet",
    preview: "/samples/letter-a.png",
    fallbackPreview: "/brand/preview-letter.svg",
    tint: "bg-[#FFF1E6]",
    accent: "text-[#E07A3A]",
    chip: "bg-[#FFE0C7] text-[#B85A1A]",
    freeBridge: "/free/alphabet_tracing_01",
  },
  {
    id: "number_tracing",
    title: "Number Tracing",
    shortTitle: "Numbers",
    blurb: "Trace 0–9 & count objects",
    detail: "Big numeral outlines plus counting pictures so kids connect number shape → quantity.",
    ages: "Ages 2–5",
    sample: "Number 3 with stars",
    preview: "/samples/number-3.png",
    fallbackPreview: "/brand/preview-number.svg",
    tint: "bg-[#E6F7ED]",
    accent: "text-[#2F9B64]",
    chip: "bg-[#C8F0D8] text-[#1F7A4B]",
    freeBridge: "/free/number_tracing_01",
  },
  {
    id: "coloring_page",
    title: "Coloring Page",
    shortTitle: "Coloring",
    blurb: "Thick outlines, big fill zones",
    detail: "Black-and-white line art (dinos, animals, space…). Easy for little hands and home printers.",
    ages: "Ages 2–5",
    sample: "Cute dinosaur page",
    preview: "/samples/dino-coloring.png",
    fallbackPreview: "/brand/preview-coloring.svg",
    tint: "bg-[#F1ECFF]",
    accent: "text-[#6B56B0]",
    chip: "bg-[#E0D6FF] text-[#4F3C8F]",
    freeBridge: "/free/dino_coloring_01",
  },
  {
    id: "counting_worksheet",
    title: "Counting Worksheet",
    shortTitle: "Counting",
    blurb: "Count, then circle the number",
    detail: "Four picture groups on one page. Kids count farm animals, fruit, or toys and circle 1–10.",
    ages: "Ages 3–5",
    sample: "Farm animal count & circle",
    preview: "/samples/farm-count.png",
    fallbackPreview: "/brand/preview-counting.svg",
    tint: "bg-[#FFF8DF]",
    accent: "text-[#C49010]",
    chip: "bg-[#FFE9A8] text-[#8A6408]",
    freeBridge: "/free/farm_counting_01",
  },
];

export function getPrintableKind(id: string): PrintableKind | undefined {
  return PRINTABLE_KINDS.find((p) => p.id === id);
}
