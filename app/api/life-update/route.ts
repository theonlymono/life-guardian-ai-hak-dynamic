import { lifeUpdateRequestSchema } from "@/lib/ai/schemas";
import { runLifeUpdate } from "@/lib/ai/pipeline";
import { errorResponse, json, languageFromUnknown, readJson } from "@/lib/api/http";
import { resolveLanguage } from "@/lib/i18n/language";

export async function POST(request: Request) {
  const body = await readJson(request);
  const language = languageFromUnknown(
    body,
    body && typeof body === "object" && "input" in body
      ? String((body as { input?: unknown }).input ?? "")
      : undefined,
  );
  const parsed = lifeUpdateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", language);
  }

  const resolved = resolveLanguage(parsed.data.language, parsed.data.input);

  try {
    const result = await runLifeUpdate(
      parsed.data.input,
      resolved,
      parsed.data.context,
    );
    return json({
      success: true,
      language: resolved,
      updatedContext: result.updatedContext,
      changesDetected: result.changesDetected,
      dailyAction: result.dailyAction,
      assistantMessage: result.assistantMessage,
      source: result.source,
    });
  } catch (error) {
    const code =
      error instanceof Error && error.message === "AI_NOT_CONFIGURED"
        ? "AI_NOT_CONFIGURED"
        : "AI_ANALYSIS_FAILED";
    return errorResponse(code, resolved);
  }
}
