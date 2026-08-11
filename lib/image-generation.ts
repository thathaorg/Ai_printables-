import openai from "./openai-client";

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  prompt?: string;
}

// Image models to try in order (PRD: Gemini 2.5 Flash via OpenRouter)
const IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-2.5-flash-image-preview",
];

/**
 * Full-quality image gen. OpenRouter response cache: identical requests within
 * TTL are free (short-lived); durable worksheet cache lives in WorksheetCache.
 */
export async function generateImageWithOpenRouter(prompt: string): Promise<ImageGenerationResponse> {
  let lastError: Error | null = null;

  for (const model of IMAGE_MODELS) {
    try {
      const response = await openai.chat.completions.create(
        {
          model,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: prompt }],
            },
          ],
          // OpenRouter extension for image output
          modalities: ["image", "text"],
        } as any,
        {
          headers: {
            // Free identical responses for up to 24h (burst/reuse layer)
            "X-OpenRouter-Cache": "true",
            "X-OpenRouter-Cache-TTL": process.env.OPENROUTER_CACHE_TTL ?? "86400",
          },
        }
      );

      const message: any = response.choices[0]?.message;
      const imageUrl = message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        return { success: true, imageUrl, prompt };
      }
      lastError = new Error(`Model ${model} returned no images`);
    } catch (err) {
      console.warn(`Image model ${model} failed:`, err);
      lastError = err as Error;
    }
  }

  return {
    success: false,
    error: lastError?.message ?? "Failed to generate image",
  };
}
