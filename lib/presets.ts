// ============================================================
// KIWIZ Preset Template Engine
// Every worksheet type is a preset: a prompt template + a small
// set of user-controlled options. Adding a new worksheet type =
// adding one entry here. No new UI logic, no new pipeline code.
// ============================================================

export interface PresetOption {
  key: string;
  label: string;
  values: string[];
  /** allow free text ("Custom") in addition to the dropdown values */
  allowCustom?: boolean;
  default?: string;
}

export interface Preset {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** template with {placeholders} matching option keys */
  promptTemplate: string;
  options: PresetOption[];
  /** tags drive thank-you recommendations + email segmentation */
  tags: string[];
}

export const PRESETS: Preset[] = [
  {
    id: "alphabet_tracing",
    title: "Alphabet Tracing",
    emoji: "🔤",
    description: "Trace capital letters A–Z with guide arrows",
    promptTemplate: `A clean black and white alphabet tracing worksheet for a {age}-year-old child.
The page shows the capital letter "{letter}" as a large hollow outline letter at the top for coloring,
followed by 4 rows of the same capital letter "{letter}" in light gray dashed/dotted outline form for tracing practice,
with faint directional stroke arrows on the first letter of each row.
Include a simple line drawing of an object starting with "{letter}" in one corner for decoration.
Thick clean outlines, large letterforms, lots of white space, print-ready A4 layout,
"Name: ____ Date: ____" header on a single compact line at the very top.
No colors, no shading, kid-friendly, safe for children.`,
    options: [
      { key: "letter", label: "Letter", values: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), default: "A" },
      { key: "age", label: "Age", values: ["2-3", "4-5"], default: "4-5" },
    ],
    tags: ["tracing", "alphabet", "letters"],
  },
  {
    id: "number_tracing",
    title: "Number Tracing",
    emoji: "🔢",
    description: "Trace numbers 0–9 with counting objects",
    promptTemplate: `A clean black and white number tracing worksheet for a {age}-year-old child.
The page shows the number "{number}" as a large hollow outline numeral at the top for coloring,
followed by 4 rows of the same number "{number}" in light gray dashed/dotted outline form for tracing practice,
with faint directional stroke arrows on the first numeral of each row.
Include exactly {number} simple line drawings of {countObject} arranged in a row near the bottom for counting.
Thick clean outlines, large numerals, lots of white space, print-ready A4 layout,
"Name: ____ Date: ____" header on a single compact line at the very top.
No colors, no shading, kid-friendly, safe for children.`,
    options: [
      { key: "number", label: "Number", values: "0123456789".split(""), default: "1" },
      { key: "countObject", label: "Count with", values: ["stars", "apples", "balloons", "fish", "flowers"], default: "stars" },
      { key: "age", label: "Age", values: ["2-3", "4-5"], default: "4-5" },
    ],
    tags: ["tracing", "numbers", "counting"],
  },
  {
    id: "coloring_page",
    title: "Coloring Page",
    emoji: "🎨",
    description: "A themed coloring page with thick outlines",
    promptTemplate: `Black and white line-art coloring page for a {age}-year-old child.
Subject: {topic}. Style: {style}. Difficulty: {difficulty}.
Thick clean bold outlines, large white regions easy to color with crayons, no small details,
composition fills the whole A4 page edge to edge,
"Name: ____ Date: ____" header on a single compact line at the very top.
No text on the artwork itself, no shading, no grayscale fills, kid-friendly, safe for children.`,
    options: [
      { key: "topic", label: "Topic", values: ["Animals", "Dinosaurs", "Space", "Farm", "Ocean", "Vehicles"], allowCustom: true, default: "Dinosaurs" },
      { key: "style", label: "Style", values: ["Cute", "Simple", "Realistic"], default: "Cute" },
      { key: "age", label: "Age", values: ["2-3", "4-5"], default: "4-5" },
      { key: "difficulty", label: "Difficulty", values: ["Easy", "Medium"], default: "Easy" },
    ],
    tags: ["coloring"],
  },
  {
    id: "counting_worksheet",
    title: "Counting Worksheet",
    emoji: "🧮",
    description: "Count groups of objects and circle the number",
    promptTemplate: `A clean black and white counting practice worksheet for a {age}-year-old child.
The page has 4 large boxes. Each box contains a different small group (between 1 and {maxCount}) of simple line drawings of {subject},
and below each group a row of the numbers 1 to {maxCount} in outline form so the child can circle the correct count.
Thick clean outlines, large simple shapes, lots of white space, print-ready A4 layout,
"Name: ____ Date: ____" header on a single compact line at the very top.
No colors, no shading, kid-friendly, safe for children.`,
    options: [
      { key: "subject", label: "Count what?", values: ["Farm animals", "Fruits", "Toys", "Sea creatures", "Bugs"], allowCustom: true, default: "Farm animals" },
      { key: "maxCount", label: "Count up to", values: ["5", "10"], default: "5" },
      { key: "age", label: "Age", values: ["2-3", "4-5"], default: "4-5" },
    ],
    tags: ["counting", "numbers", "math"],
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/**
 * Fill a preset's prompt template with validated option values.
 * Unknown options are ignored; missing options fall back to defaults.
 * Custom values are only accepted where the option allows them.
 */
export function buildPrompt(preset: Preset, raw: Record<string, string>): { prompt: string; options: Record<string, string> } {
  const options: Record<string, string> = {};
  for (const opt of preset.options) {
    const value = (raw[opt.key] ?? "").toString().trim();
    if (value && (opt.values.includes(value) || opt.allowCustom)) {
      // hard cap custom values so they can't smuggle prompt injections
      options[opt.key] = value.slice(0, 60);
    } else {
      options[opt.key] = opt.default ?? opt.values[0];
    }
  }
  const prompt = preset.promptTemplate.replace(/\{(\w+)\}/g, (_, key: string) => options[key] ?? "");
  return { prompt, options };
}

/** Tag-based recommendations for the thank-you page ("You made Letter A → try Letter B") */
export function getRecommendations(presetId: string, options: Record<string, string>): { presetId: string; label: string; params: Record<string, string> }[] {
  const recs: { presetId: string; label: string; params: Record<string, string> }[] = [];

  if (presetId === "alphabet_tracing") {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const next = letters[(letters.indexOf(options.letter ?? "A") + 1) % 26];
    recs.push({ presetId: "alphabet_tracing", label: `Trace the letter ${next}`, params: { letter: next } });
    recs.push({ presetId: "number_tracing", label: "Try number tracing", params: {} });
    recs.push({ presetId: "coloring_page", label: "Animal coloring page", params: { topic: "Animals" } });
  } else if (presetId === "number_tracing") {
    const next = String((parseInt(options.number ?? "1", 10) + 1) % 10);
    recs.push({ presetId: "number_tracing", label: `Trace the number ${next}`, params: { number: next } });
    recs.push({ presetId: "counting_worksheet", label: "Counting worksheet", params: {} });
    recs.push({ presetId: "alphabet_tracing", label: "Try alphabet tracing", params: {} });
  } else if (presetId === "coloring_page") {
    recs.push({ presetId: "coloring_page", label: "Another coloring theme", params: {} });
    recs.push({ presetId: "counting_worksheet", label: `Counting ${options.topic ?? "animals"}`, params: { subject: options.topic ?? "Farm animals" } });
    recs.push({ presetId: "alphabet_tracing", label: "Alphabet tracing", params: {} });
  } else {
    recs.push({ presetId: "coloring_page", label: "A coloring page", params: {} });
    recs.push({ presetId: "number_tracing", label: "Number tracing", params: {} });
    recs.push({ presetId: "alphabet_tracing", label: "Alphabet tracing", params: {} });
  }
  return recs;
}
