import OpenAI from "openai";

const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

export function isDemoBackupMode(): boolean {
  return process.env.DEMO_BACKUP_MODE === "true";
}

function getApiKey(): string | undefined {
  return (
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.NETLIFY_AI_GATEWAY_KEY
  );
}

export function isAiConfigured(): boolean {
  return Boolean(getApiKey());
}

export function getAiModel(): string {
  return process.env.AI_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
}

function getBaseUrl(): string | undefined {
  const explicit =
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.NETLIFY_AI_GATEWAY_BASE_URL;
  if (explicit) return explicit;
  // Google AI Studio keys only work against Gemini's OpenAI-compatible endpoint.
  if (!process.env.AI_API_KEY && process.env.GEMINI_API_KEY) {
    return GEMINI_OPENAI_BASE_URL;
  }
  return undefined;
}

export function getAiClient(): OpenAI {
  const baseURL = getBaseUrl();
  return new OpenAI({
    apiKey: getApiKey() || "missing-key",
    ...(baseURL ? { baseURL } : {}),
  });
}

function numberFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function completeJson(prompt: string, system: string): Promise<unknown> {
  const client = getAiClient();
  const completion = await client.chat.completions.create({
    model: getAiModel(),
    temperature: numberFromEnv("GEMINI_TEMPERATURE", 0.2),
    top_p: numberFromEnv("GEMINI_TOP_P", 0.95),
    max_tokens: numberFromEnv("GEMINI_MAX_OUTPUT_TOKENS", 2048),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("EMPTY_AI_CONTENT");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("INVALID_AI_JSON");
  }
}
