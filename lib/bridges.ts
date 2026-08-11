// ============================================================
// KIWIZ Bridge Pages
// A bridge page is a fast marketing door: 0–2 quick questions,
// then into /create with answers pre-filled via URL params.
// New bridge page = new config entry here. Never new logic.
// Bridge pages NEVER collect email and NEVER generate anything.
// ============================================================

export type BridgeTemplate =
  | "offer" // single CTA
  | "letter_picker" // pick A–Z
  | "number_picker" // pick 0–9
  | "theme_picker" // pick a style/theme
  | "age_gate" // pick an age
  | "mini_quiz" // multi-step questions
  | "teacher"; // classroom worksheet type picker

export interface BridgeQuizStep {
  question: string;
  options: string[];
  payloadKey: string;
}

export interface BridgeConfig {
  bridgeId: string;
  template: BridgeTemplate;
  headline: string;
  subline: string;
  cta: string;
  /** for theme_picker/age_gate/teacher: the choices shown */
  options?: string[];
  /** which /create param the picked option fills */
  payloadKey?: string;
  /** always merged into the /create URL */
  payload: Record<string, string>;
  emoji: string;
  /** multi-step quiz (mini_quiz template) */
  quizSteps?: BridgeQuizStep[];
}

export const BRIDGES: BridgeConfig[] = [
  {
    bridgeId: "dino_coloring_01",
    template: "theme_picker",
    headline: "Free Dinosaur Coloring Pages",
    subline: "Pick a style — your print-ready page is seconds away",
    cta: "Make my coloring page",
    options: ["Cute", "Simple", "Realistic"],
    payloadKey: "style",
    payload: { preset: "coloring_page", topic: "Dinosaurs" },
    emoji: "🦕",
  },
  {
    bridgeId: "alphabet_tracing_01",
    template: "letter_picker",
    headline: "Free Alphabet Tracing Worksheets",
    subline: "Pick a letter to practice — instant printable PDF",
    cta: "Make my tracing sheet",
    payloadKey: "letter",
    payload: { preset: "alphabet_tracing" },
    emoji: "✏️",
  },
  {
    bridgeId: "number_tracing_01",
    template: "number_picker",
    headline: "Free Number Tracing Worksheets",
    subline: "Pick a number 0–9 — instant printable PDF",
    cta: "Make my number sheet",
    payloadKey: "number",
    payload: { preset: "number_tracing" },
    emoji: "🔢",
  },
  {
    bridgeId: "toddler_pack_01",
    template: "age_gate",
    headline: "Free Printables for Toddlers",
    subline: "How old is your little one?",
    cta: "Get my free worksheets",
    options: ["2-3", "4-5"],
    payloadKey: "age",
    payload: { preset: "coloring_page" },
    emoji: "🧸",
  },
  {
    bridgeId: "farm_counting_01",
    template: "offer",
    headline: "Free Farm Animal Counting Worksheets",
    subline: "Count the cows, circle the number — toddlers love it",
    cta: "Get my counting worksheet",
    payload: { preset: "counting_worksheet", subject: "Farm animals" },
    emoji: "🐄",
  },
  {
    bridgeId: "dino_quiz_01",
    template: "mini_quiz",
    headline: "Which dino printable is right?",
    subline: "Two quick picks — then a free coloring page made for your child",
    cta: "Make my free printable",
    payload: { preset: "coloring_page", topic: "Dinosaurs" },
    emoji: "🧩",
    quizSteps: [
      {
        question: "What style do they like?",
        options: ["Cute", "Simple", "Realistic"],
        payloadKey: "style",
      },
      {
        question: "How old are they?",
        options: ["2-3", "4-5"],
        payloadKey: "age",
      },
    ],
  },
  {
    bridgeId: "teacher_pack_01",
    template: "teacher",
    headline: "Free Classroom Printables for Teachers",
    subline: "Pick a worksheet type — print a whole set for circle time",
    cta: "Open classroom studio",
    options: [
      "coloring_page",
      "alphabet_tracing",
      "number_tracing",
      "counting_worksheet",
    ],
    payloadKey: "preset",
    payload: { preset: "coloring_page", age: "4-5" },
    emoji: "🍎",
  },
];

export function getBridge(bridgeId: string): BridgeConfig | undefined {
  return BRIDGES.find((b) => b.bridgeId === bridgeId);
}
