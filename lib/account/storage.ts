import type { GoalSimulation } from "@/lib/simulation/goal";
import type { Turn } from "@/lib/types/conversation";
import type {
  DailyAction,
  LifeContext,
  LifeSummary,
  SupportedLanguage,
} from "@/lib/types/life-context";

/**
 * The customer's own copy of every conversation they have had, keyed by their
 * local account.
 *
 * The backend stays stateless — each request still carries the LifeContext —
 * so this is what lets a refresh, a new chat, or a return visit keep the
 * earlier ones reachable. Starting a new conversation must never be a way to
 * lose the last one; that is the whole point of a history list.
 */

const PREFIX = "life-guardian.session.";
const MAX_CONVERSATIONS = 30;

/**
 * Whose history a stored copy belongs to.
 *
 * Browser storage is shared by everyone who uses the device, so the owner has
 * to be part of the key. Without it, one person's conversations are sitting
 * there waiting to be read — and written into someone else's account — the
 * moment a second person signs in.
 */
export type Owner = string;

export function guestOwner(localAccountId: string): Owner {
  return `guest:${localAccountId}`;
}

export function userOwner(username: string): Owner {
  return `user:${username.toLowerCase()}`;
}

export interface Conversation {
  id: string;
  title: string | null;
  language: SupportedLanguage;
  context: LifeContext;
  turns: Turn[];
  action: DailyAction | null;
  summary: LifeSummary | null;
  simulation: GoalSimulation | null;
  answered: number;
  savedAt: string;
}

export interface StoredAccount {
  conversations: Conversation[];
  activeId: string | null;
}

function keyFor(owner: Owner): string {
  return `${PREFIX}${owner}`;
}

/** A turn saved mid-request will never complete, so it is shown as failed. */
function settle(turns: unknown): Turn[] {
  if (!Array.isArray(turns)) return [];
  return (turns as Turn[]).map((turn) =>
    turn.pending ? { ...turn, pending: false, failed: true } : turn,
  );
}

function normalise(value: Partial<Conversation>, index: number): Conversation | null {
  if (!value.context) return null;
  return {
    id: value.id ?? `conv_${index}_${Date.parse(value.savedAt ?? "") || index}`,
    title: value.title ?? null,
    language: value.language === "my" ? "my" : "en",
    context: value.context,
    turns: settle(value.turns),
    action: value.action ?? null,
    summary: value.summary ?? null,
    simulation: value.simulation ?? null,
    answered: value.answered ?? 0,
    savedAt: value.savedAt ?? new Date().toISOString(),
  };
}

/**
 * Reads the stored shape, including the earlier one that held a single
 * conversation. An upgrade that silently discarded someone's session would be
 * the same failure as deleting it.
 */
export function parseStored(raw: unknown): StoredAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<StoredAccount> & Partial<Conversation>;

  if (Array.isArray(value.conversations)) {
    const conversations = value.conversations
      .map((item, index) => normalise(item, index))
      .filter((item): item is Conversation => item !== null);
    if (conversations.length === 0) return null;
    return { conversations, activeId: value.activeId ?? conversations[0].id };
  }

  const legacy = normalise(value, 0);
  return legacy ? { conversations: [legacy], activeId: legacy.id } : null;
}

export function loadAccountData(owner: Owner): StoredAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(owner));
    return raw ? parseStored(JSON.parse(raw)) : null;
  } catch {
    // Corrupt storage should cost the customer a history, not the ability to
    // start a new conversation.
    return null;
  }
}

export function saveAccountData(owner: Owner, data: StoredAccount): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(owner), JSON.stringify(trim(data)));
  } catch {
    // Nothing to recover from: the live session in memory is unaffected.
  }
}

export function clearAccountData(owner: Owner): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(owner));
  } catch {
    // Ignored for the same reason as above.
  }
}

/** Newest first, and capped so one browser cannot fill its storage quota. */
export function trim(data: StoredAccount): StoredAccount {
  const conversations = [...data.conversations]
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
    .slice(0, MAX_CONVERSATIONS);
  return { conversations, activeId: data.activeId };
}

/** Replaces the matching conversation, or adds it when it is the first turn. */
export function upsert(
  conversations: Conversation[],
  conversation: Conversation,
): Conversation[] {
  const index = conversations.findIndex((item) => item.id === conversation.id);
  if (index === -1) return [conversation, ...conversations];

  const next = [...conversations];
  next[index] = conversation;
  return next;
}
