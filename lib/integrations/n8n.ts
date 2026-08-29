import type { FollowUpRequest } from "@/lib/types/api";

export function isN8nConfigured(): boolean {
  return Boolean(process.env.N8N_WEBHOOK_URL);
}

export async function triggerFollowUp(
  payload: FollowUpRequest,
): Promise<{ success: boolean; workflowStatus: "scheduled" | "unavailable" }> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return { success: false, workflowStatus: "unavailable" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        language: payload.language ?? "en",
        focus: payload.nextAction?.focus ?? payload.completedAction?.focus,
        completedAction: payload.completedAction?.question,
        nextAction: payload.nextAction?.title,
        followUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        context: payload.context,
        completedActionRecord: payload.completedAction,
        nextActionRecord: payload.nextAction,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { success: false, workflowStatus: "unavailable" };
    }
    return { success: true, workflowStatus: "scheduled" };
  } catch {
    return { success: false, workflowStatus: "unavailable" };
  }
}
