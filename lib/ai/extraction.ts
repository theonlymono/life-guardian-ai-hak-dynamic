import { extractionResultSchema, type ExtractionResult } from "@/lib/ai/schemas";
import { completeJson, isAiConfigured, isDemoBackupMode } from "@/lib/ai/client";
import { EXTRACTION_SYSTEM, extractionUserPrompt } from "@/lib/ai/prompts";
import { demoExtraction } from "@/lib/demo/backup";
import type { SupportedLanguage } from "@/lib/types/life-context";

export async function extractLifeContext(
  input: string,
  language: SupportedLanguage,
): Promise<{ result: ExtractionResult; source: "live_ai" | "demo_backup" }> {
  if (!isAiConfigured()) {
    if (isDemoBackupMode()) {
      return { result: demoExtraction(input, language), source: "demo_backup" };
    }
    throw new Error("AI_NOT_CONFIGURED");
  }

  try {
    const raw = await completeJson(
      extractionUserPrompt(input, language),
      EXTRACTION_SYSTEM,
    );
    const parsed = extractionResultSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("INVALID_AI_RESPONSE");
    }
    return { result: parsed.data, source: "live_ai" };
  } catch (error) {
    if (isDemoBackupMode()) {
      return { result: demoExtraction(input, language), source: "demo_backup" };
    }
    throw error;
  }
}
