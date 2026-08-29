import OpenAI from "openai";

export function isDemoBackupMode(): boolean {
  return process.env.DEMO_BACKUP_MODE === "true";
}

export function isAiConfigured(): boolean {
  return Boolean(
    process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.NETLIFY_AI_GATEWAY_KEY,
  );
}

export function getAiModel(): string {
  return process.env.AI_MODEL || "gpt-4o-mini";
}

export function getAiClient(): OpenAI {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.NETLIFY_AI_GATEWAY_KEY;
  const baseURL =
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.NETLIFY_AI_GATEWAY_BASE_URL;

  return new OpenAI({
    apiKey: apiKey || "missing-key",
    ...(baseURL ? { baseURL } : {}),
  });
}

export async function completeJson(prompt: string, system: string): Promise<unknown> {
  const client = getAiClient();
  const completion = await client.chat.completions.create({
    model: getAiModel(),
    temperature: 0.2,
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
