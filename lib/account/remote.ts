import { parseStored, type StoredAccount } from "./storage";

/**
 * The signed-in account and its conversation, held in Atlas.
 *
 * Every call resolves the account from the session cookie server-side, so
 * nothing here needs to — or is allowed to — name whose history it wants.
 */

export interface AuthUser {
  username: string;
  createdAt: string;
}

export type AuthFailure = "credentials" | "taken" | "invalid" | "unavailable";

async function postCredentials(
  path: string,
  username: string,
  password: string,
): Promise<{ user: AuthUser | null; reason?: AuthFailure }> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = (await response.json()) as {
      success: boolean;
      username?: string;
      reason?: AuthFailure;
    };

    if (!body.success || !body.username) {
      return { user: null, reason: body.reason ?? "unavailable" };
    }
    return { user: { username: body.username, createdAt: new Date().toISOString() } };
  } catch {
    return { user: null, reason: "unavailable" };
  }
}

export function loginRequest(username: string, password: string) {
  return postCredentials("/api/auth/login", username, password);
}

export function signupRequest(username: string, password: string) {
  return postCredentials("/api/auth/signup", username, password);
}

export async function logoutRequest(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // The cookie stays until it expires; nothing else to do from here.
  }
}

export async function fetchAccount(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me");
    const body = (await response.json()) as { account: AuthUser | null };
    return body.account ?? null;
  } catch {
    return null;
  }
}

export async function fetchHistory(): Promise<StoredAccount | null> {
  try {
    const response = await fetch("/api/account/history");
    if (!response.ok) return null;
    const body = (await response.json()) as { history: unknown };
    // Shared with the local copy, so a history written by an older build is
    // read the same way rather than discarded.
    return parseStored(body.history);
  } catch {
    return null;
  }
}

export async function pushHistory(payload: StoredAccount): Promise<void> {
  try {
    await fetch("/api/account/history", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best effort. The browser's own copy is already saved.
  }
}
