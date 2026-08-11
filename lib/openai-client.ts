import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer":
      process.env.OPENROUTER_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://ai-printables.vercel.app",
    "X-Title": process.env.OPENROUTER_SITE_NAME || "Kiwiz",
  },
});

export default openai;
