import type { SupportedLanguage } from "@/lib/types/life-context";

/**
 * A device-local identity with no sign-in.
 *
 * The product's whole promise is that the customer comes back tomorrow and is
 * remembered. A login screen on the way in would cost more returning customers
 * than it protects. So the account is created silently on first visit, lives in
 * this browser, and can neither be logged into nor out of. Nothing here is a
 * credential and nothing here authenticates anything — the server still treats
 * the id as untrusted, using it only to group a person's own turns.
 */

const STORAGE_KEY = "life-guardian.account.v1";

export interface LocalAccount {
  id: string;
  handle: string;
  createdAt: string;
}

const ADJECTIVES: Record<SupportedLanguage, string[]> = {
  en: ["Steady", "Careful", "Quiet", "Patient", "Bright", "Calm"],
  my: ["တည်ငြိမ်", "သတိရှိ", "အေးဆေး", "စိတ်ရှည်", "ကြည်လင်", "ငြိမ်သက်"],
};

const NOUNS: Record<SupportedLanguage, string[]> = {
  en: ["Planner", "Guardian", "Keeper", "Builder"],
  my: ["စီမံသူ", "စောင့်ရှောက်သူ", "ထိန်းသိမ်းသူ", "တည်ဆောက်သူ"],
};

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

/** A name the customer can recognise without ever having typed one. */
export function handleFor(id: string, language: SupportedLanguage): string {
  const seed = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const adjective = pick(ADJECTIVES[language], seed);
  const noun = pick(NOUNS[language], Math.floor(seed / 7));
  return language === "my" ? `${adjective}${noun}` : `${adjective} ${noun}`;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `acct_${crypto.randomUUID()}`;
  }
  return `acct_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function loadAccount(): LocalAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalAccount>;
    if (!parsed.id) return null;
    return {
      id: parsed.id,
      handle: parsed.handle ?? "",
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    };
  } catch {
    // A browser with storage blocked still gets a working session, just not a
    // remembered one. Losing history is better than refusing to start.
    return null;
  }
}

export function ensureAccount(): LocalAccount {
  const existing = loadAccount();
  if (existing) return existing;

  const account: LocalAccount = {
    id: newId(),
    handle: "",
    createdAt: new Date().toISOString(),
  };
  saveAccount(account);
  return account;
}

export function saveAccount(account: LocalAccount): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // Storage is full or blocked; the session continues in memory.
  }
}
