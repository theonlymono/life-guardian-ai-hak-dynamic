import { chatLogRequestSchema } from "@/lib/ai/schemas";
import { json, languageFromUnknown, errorResponse, readJson } from "@/lib/api/http";
import { resolveLanguage } from "@/lib/i18n/language";
import { logChatTurn } from "@/lib/integrations/chat-log";

/**
 * Persists one conversation turn through n8n into MongoDB Atlas.
 *
 * The webhook URL stays server-side so the browser never sees it, and a
 * storage failure returns 200 with stored:false — the caller treats this as
 * fire-and-forget and must not retry or show an error.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const language = languageFromUnknown(body);
  const parsed = chatLogRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", language);
  }

  const result = await logChatTurn({
    ...parsed.data,
    language: resolveLanguage(parsed.data.language),
  });
  return json(result);
}
