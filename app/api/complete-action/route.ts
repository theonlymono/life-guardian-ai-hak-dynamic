import { completeActionRequestSchema } from "@/lib/ai/schemas";
import { runCompleteAction } from "@/lib/ai/pipeline";
import { errorResponse, json, languageFromUnknown, readJson } from "@/lib/api/http";
import { resolveLanguage } from "@/lib/i18n/language";
import type { CompleteActionResponse } from "@/lib/types/api";

export async function POST(request: Request) {
  const body = await readJson(request);
  const language = languageFromUnknown(body);
  const parsed = completeActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", language);
  }

  const resolved = resolveLanguage(parsed.data.language);

  try {
    const result = await runCompleteAction({
      language: resolved,
      context: parsed.data.context,
      action: parsed.data.action,
      answer: parsed.data.answer,
    });
    const body: CompleteActionResponse = {
      success: true,
      language: resolved,
      updatedContext: result.updatedContext,
      nextAction: result.nextAction,
      summary: result.summary,
      questionsAnswered: result.questionsAnswered,
      questionsTotal: result.questionsTotal,
      assistantMessage: result.assistantMessage,
      source: result.source,
    };
    return json(body);
  } catch (error) {
    const code =
      error instanceof Error && error.message === "AI_NOT_CONFIGURED"
        ? "AI_NOT_CONFIGURED"
        : "AI_ANALYSIS_FAILED";
    return errorResponse(code, resolved);
  }
}
