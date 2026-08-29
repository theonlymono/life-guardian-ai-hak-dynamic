import { analyzeRequestSchema } from "@/lib/ai/schemas";
import { runAnalyze } from "@/lib/ai/pipeline";
import { errorResponse, json, languageFromUnknown, readJson } from "@/lib/api/http";
import { resolveLanguage } from "@/lib/i18n/language";
import type { AnalyzeResponse } from "@/lib/types/api";

export async function POST(request: Request) {
  const body = await readJson(request);
  const language = languageFromUnknown(
    body,
    body && typeof body === "object" && "input" in body
      ? String((body as { input?: unknown }).input ?? "")
      : undefined,
  );
  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", language);
  }

  const resolved = resolveLanguage(parsed.data.language, parsed.data.input);

  try {
    const result = await runAnalyze(
      parsed.data.input,
      resolved,
      parsed.data.existingContext,
    );
    const body: AnalyzeResponse = {
      success: true,
      language: resolved,
      context: result.context,
      dailyAction: result.dailyAction,
      summary: result.summary,
      simulation: result.simulation,
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
        : error instanceof Error && error.message === "INVALID_AI_RESPONSE"
          ? "INVALID_AI_RESPONSE"
          : "AI_ANALYSIS_FAILED";
    return errorResponse(code, resolved);
  }
}
