import type { ChatLogRequest } from "@/lib/types/api";
import { isMongoConfigured, storeChatTurn } from "./mongo";

export function isChatLogConfigured(): boolean {
  return isMongoConfigured() || Boolean(process.env.N8N_CHAT_LOG_WEBHOOK_URL);
}

/**
 * Archives one conversation turn.
 *
 * Two routes exist and exactly one runs, so a turn is never stored twice. The
 * direct Atlas write wins when `MONGODB_URI` is set because it removes a
 * network hop; the n8n webhook is the fallback for deployments that would
 * rather keep database credentials out of the app entirely.
 *
 * This is an audit trail, not part of the engagement loop: a missing config, a
 * broken workflow, or a dead database must never surface to the customer, so
 * every failure resolves to `stored: false`.
 */
export async function logChatTurn(
  payload: ChatLogRequest,
): Promise<{ success: boolean; stored: boolean }> {
  if (isMongoConfigured()) {
    const stored = await storeChatTurn(payload);
    return { success: stored, stored };
  }

  const url = process.env.N8N_CHAT_LOG_WEBHOOK_URL;
  if (!url) {
    return { success: false, stored: false };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        language: payload.language ?? "en",
        kind: payload.kind,
        userText: payload.userText,
        assistantText: payload.assistantText ?? "",
        action: payload.action ?? null,
        risks: payload.risks ?? [],
        riskMoves: payload.riskMoves ?? [],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { success: false, stored: false };
    }

    // The workflow reports stored:false when the Mongo insert itself failed.
    const body = (await response.json().catch(() => null)) as {
      stored?: boolean;
    } | null;
    return { success: true, stored: body?.stored !== false };
  } catch {
    return { success: false, stored: false };
  }
}
