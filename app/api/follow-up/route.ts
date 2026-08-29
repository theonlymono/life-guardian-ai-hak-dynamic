import { followUpRequestSchema } from "@/lib/ai/schemas";
import { errorResponse, json, languageFromUnknown, readJson } from "@/lib/api/http";
import { resolveLanguage } from "@/lib/i18n/language";
import { triggerFollowUp } from "@/lib/integrations/n8n";

export async function POST(request: Request) {
  const body = await readJson(request);
  const language = languageFromUnknown(body);
  const parsed = followUpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", language);
  }

  const resolved = resolveLanguage(parsed.data.language);
  const result = await triggerFollowUp({
    ...parsed.data,
    language: resolved,
  });
  return json(result);
}
