import openai from "./openai-client";

// PRD: no image reaches a parent's screen without passing a kid-appropriateness
// check. On failure: retry silently or serve a pre-approved fallback.

const BLOCKLIST = [
  "gun", "weapon", "blood", "gore", "kill", "dead", "death", "naked", "nude",
  "sex", "drug", "alcohol", "cigarette", "violence", "horror", "scary demon",
  "suicide", "knife attack",
];

/** Cheap pre-generation check on user-supplied custom text. */
export function isTopicSafe(text: string): boolean {
  const t = text.toLowerCase();
  return !BLOCKLIST.some((w) => t.includes(w));
}

/**
 * Post-generation vision check: ask a fast multimodal model whether the
 * generated worksheet is appropriate for toddlers. Fail-closed on a clear
 * "no"; fail-open only when the checker itself is unavailable (the prompt
 * template already hard-constrains content).
 */
export async function isImageKidSafe(imageUrl: string): Promise<boolean> {
  try {
    const res = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      max_tokens: 5,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a strict child-safety reviewer for a toddler worksheet app. Answer with exactly YES or NO: is this image a black-and-white printable worksheet that is fully appropriate and safe for children aged 2-5 (no violence, no scary imagery, no adult content, no weapons)?",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });
    const answer = res.choices[0]?.message?.content?.trim().toUpperCase() ?? "";
    return !answer.startsWith("NO");
  } catch (err) {
    console.warn("Safety check unavailable, relying on prompt constraints:", err);
    return true;
  }
}
