import Groq from "groq-sdk";

export const GROQ_MODEL = "llama-3.3-70b-versatile";

let groqClient: Groq | null = null;

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}
