import { speakRequestSchema } from "@/lib/ai/schemas";
import { errorResponse, json, languageFromUnknown, readJson } from "@/lib/api/http";
import { resolveLanguage } from "@/lib/i18n/language";
import { synthesizeSpeech } from "@/lib/integrations/elevenlabs";

export async function POST(request: Request) {
  const body = await readJson(request);
  const language = languageFromUnknown(
    body,
    body && typeof body === "object" && "text" in body
      ? String((body as { text?: unknown }).text ?? "")
      : undefined,
  );
  const parsed = speakRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", language);
  }

  const resolved = resolveLanguage(parsed.data.language, parsed.data.text);
  const result = await synthesizeSpeech(parsed.data.text, resolved);
  return json(result);
}
