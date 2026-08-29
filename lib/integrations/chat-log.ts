import type { ChatLogRequest } from "@/lib/types/api";

export function isChatLogConfigured(): boolean {
  return Boolean(process.env.N8N_CHAT_LOG_WEBHOOK_URL);
}

/**
 * Sends one conversation turn to the n8n workflow that writes it to MongoDB
 * Atlas. This is an audit trail, not part of the engagement loop: a missing
 * webhook, a broken workflow, or a dead database must never surface to the
 * customer, so every failure resolves to `stored: false`.
 */
export async function logChatTurn(
  payload: ChatLogRequest,
): Promise<{ success: boolean; stored: boolean }> {
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
