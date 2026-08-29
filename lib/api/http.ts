import { ZodError } from "zod";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/types/api";
import { errorMessage, resolveLanguage } from "@/lib/i18n/language";
import type { SupportedLanguage } from "@/lib/types/life-context";

export function json<T>(body: T, status = 200): Response {
  return Response.json(body, { status });
}

export function errorResponse(
  code: ApiErrorCode,
  language: SupportedLanguage = "en",
  status = statusFor(code),
): Response {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code,
      message: errorMessage(code, language),
    },
  };
  return json(body, status);
}

function statusFor(code: ApiErrorCode): number {
  switch (code) {
    case "INVALID_REQUEST":
      return 400;
    case "AI_NOT_CONFIGURED":
      return 503;
    case "AI_ANALYSIS_FAILED":
    case "INVALID_AI_RESPONSE":
      return 502;
    case "ELEVENLABS_FAILED":
    case "N8N_UNAVAILABLE":
      return 200;
    default:
      return 500;
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function languageFromUnknown(value: unknown, input?: string): SupportedLanguage {
  const explicit =
    value && typeof value === "object" && "language" in value
      ? (value as { language?: unknown }).language
      : undefined;
  return resolveLanguage(typeof explicit === "string" ? explicit : undefined, input);
}

export function zodErrorToMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
