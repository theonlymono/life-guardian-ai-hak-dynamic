import OpenAI from "openai";

const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

export function isDemoBackupMode(): boolean {
  return process.env.DEMO_BACKUP_MODE === "true";
}

function splitKeys(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

/**
 * Keys in the order we should reach for them. The plural vars carry the pool;
 * the singular ones stay supported so an existing deployment keeps working.
 * Deduped because the first pool key is usually also set as AI_API_KEY.
 */
export function getApiKeys(): string[] {
  return [
    ...new Set([
      ...splitKeys(process.env.AI_API_KEYS),
      ...splitKeys(process.env.GEMINI_API_KEYS),
      ...splitKeys(process.env.AI_API_KEY),
      ...splitKeys(process.env.GEMINI_API_KEY),
      ...splitKeys(process.env.OPENAI_API_KEY),
      ...splitKeys(process.env.NETLIFY_AI_GATEWAY_KEY),
    ]),
  ];
}

export function isAiConfigured(): boolean {
  return getApiKeys().length > 0;
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
  // Google AI Studio keys only work against Gemini's OpenAI-compatible endpoint,
  // and that is what this project runs on, so it is the default. Only an
  // OpenAI-style key sends us to the SDK's own default host.
  if (!process.env.OPENAI_API_KEY && !process.env.NETLIFY_AI_GATEWAY_KEY) {
    return GEMINI_OPENAI_BASE_URL;
  }
  return undefined;
}

function clientForKey(key: string): OpenAI {
  const baseURL = getBaseUrl();
  return new OpenAI({ apiKey: key, ...(baseURL ? { baseURL } : {}) });
}

/**
 * Spent quota, a revoked key, or a key the project no longer covers.
 *
 * 400 is in here because Gemini's OpenAI-compatible endpoint answers a rejected
 * key with `400 Please pass a valid API key` wrapped in a JSON array, which the
 * OpenAI SDK cannot parse — every error arrives with no body, so status is the
 * only thing left to read. 404 and 5xx stay out: a missing model or a broken
 * upstream answers the same way on every key.
 */
const KEY_EXHAUSTED_STATUS = new Set([400, 401, 403, 429]);
const KEY_EXHAUSTED_MESSAGE =
  /quota|rate.?limit|exhausted|api key not valid|invalid api key|permission denied/i;

/**
 * Only failover for problems another key can actually solve. A refused
 * generation or an unparseable reply fails the same way on every key, and
 * burning the whole pool on it would just multiply the wait before the caller's
 * own fallback runs.
 */
export function shouldTryNextKey(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") return KEY_EXHAUSTED_STATUS.has(status);
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && KEY_EXHAUSTED_MESSAGE.test(message);
}

/**
 * The key that last worked. Once a key is out of quota it stays out for the
 * rest of the window, so starting from it again would cost every later request
 * a wasted round trip.
 */
let preferredKeyIndex = 0;

function numberFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requestJson(key: string, prompt: string, system: string): Promise<unknown> {
  const completion = await clientForKey(key).chat.completions.create({
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

export async function completeJson(prompt: string, system: string): Promise<unknown> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const start = preferredKeyIndex % keys.length;
  let lastError: unknown;

  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const index = (start + attempt) % keys.length;
    try {
      const result = await requestJson(keys[index], prompt, system);
      preferredKeyIndex = index;
      return result;
    } catch (error) {
      if (!shouldTryNextKey(error)) throw error;
      lastError = error;
    }
  }

  throw lastError;
}
