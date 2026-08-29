import { json, readJson } from "@/lib/api/http";
import { accountForToken, loadHistory, saveHistory } from "@/lib/auth/accounts";
import { readSessionCookie } from "@/lib/auth/cookie";

/**
 * The signed-in account's saved conversation.
 *
 * The account is resolved from the session cookie and never from anything the
 * client sends, so nobody can name someone else's account and read their
 * history back.
 */

export async function GET(): Promise<Response> {
  const account = await accountForToken(await readSessionCookie());
  if (!account) return json({ success: false, reason: "unauthenticated" }, 401);

  const history = await loadHistory(account.username);
  return json({ success: true, history });
}

export async function PUT(request: Request): Promise<Response> {
  const account = await accountForToken(await readSessionCookie());
  if (!account) return json({ success: false, reason: "unauthenticated" }, 401);

  const payload = await readJson(request);
  if (!payload || typeof payload !== "object") {
    return json({ success: false, reason: "invalid" }, 400);
  }

  const stored = await saveHistory(account.username, payload);
  // Failing to save history must not break the conversation in progress, so
  // the caller treats this the same as the local copy: best effort.
  return json({ success: true, stored });
}
