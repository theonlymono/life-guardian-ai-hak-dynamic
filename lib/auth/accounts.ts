import { createHash } from "node:crypto";
import type { Collection, Db } from "mongodb";
import { getDatabase } from "@/lib/integrations/mongo";
import { hashPassword, newSessionToken, verifyPassword } from "./password";

/**
 * Accounts, sessions and each account's saved conversation, all in Atlas.
 *
 * Sign-in is username and password only — no email, because we would have no
 * way to verify one and an unverified address is a liability rather than a
 * recovery route. The cost of that choice is honest and worth stating: there
 * is no password reset. A forgotten password means a new account.
 */

const ACCOUNTS = "accounts";
const SESSIONS = "auth_sessions";
const HISTORIES = "account_histories";

const SESSION_DAYS = 30;

export interface AccountDocument {
  username: string;
  usernameLower: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
}

export interface AuthSessionDocument {
  /** The raw token never touches the database; a stolen dump cannot log in. */
  tokenHash: string;
  usernameLower: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface HistoryDocument {
  usernameLower: string;
  payload: unknown;
  updatedAt: Date;
}

export interface Account {
  username: string;
  createdAt: string;
}

export type SignupResult =
  | { ok: true; username: string; token: string }
  | { ok: false; reason: "taken" | "invalid" | "unavailable" };

export type LoginResult =
  | { ok: true; username: string; token: string }
  | { ok: false; reason: "credentials" | "unavailable" };

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateCredentials(username: string, password: string): boolean {
  return USERNAME_PATTERN.test(username) && password.length >= MIN_PASSWORD_LENGTH;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function collections(): Promise<{
  db: Db;
  accounts: Collection<AccountDocument>;
  sessions: Collection<AuthSessionDocument>;
  histories: Collection<HistoryDocument>;
} | null> {
  const db = await getDatabase();
  if (!db) return null;
  return {
    db,
    accounts: db.collection<AccountDocument>(ACCOUNTS),
    sessions: db.collection<AuthSessionDocument>(SESSIONS),
    histories: db.collection<HistoryDocument>(HISTORIES),
  };
}

/**
 * Ensures usernames cannot collide. Without this the check-then-insert below
 * races: two people can pass the lookup at once and both get the same name.
 */
let indexesReady: Promise<void> | undefined;
async function ensureIndexes(db: Db): Promise<void> {
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection(ACCOUNTS).createIndex({ usernameLower: 1 }, { unique: true }),
      db.collection(SESSIONS).createIndex({ tokenHash: 1 }, { unique: true }),
      // Atlas removes expired sessions for us rather than letting them pile up.
      db.collection(SESSIONS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection(HISTORIES).createIndex({ usernameLower: 1 }, { unique: true }),
    ])
      .then(() => undefined)
      .catch(() => {
        indexesReady = undefined;
      });
  }
  return indexesReady;
}

function expiryDate(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

async function startSession(
  sessions: Collection<AuthSessionDocument>,
  usernameLower: string,
): Promise<string> {
  const token = newSessionToken();
  await sessions.insertOne({
    tokenHash: tokenHash(token),
    usernameLower,
    createdAt: new Date(),
    expiresAt: expiryDate(),
  });
  return token;
}

export async function signup(username: string, password: string): Promise<SignupResult> {
  if (!validateCredentials(username, password)) return { ok: false, reason: "invalid" };

  const store = await collections();
  if (!store) return { ok: false, reason: "unavailable" };
  await ensureIndexes(store.db);

  const usernameLower = username.toLowerCase();
  const { hash, salt } = await hashPassword(password);

  try {
    await store.accounts.insertOne({
      username,
      usernameLower,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date(),
    });
  } catch (error) {
    // 11000 is the unique-index violation: the name was taken, possibly by a
    // request that arrived between our check and this insert.
    if ((error as { code?: number }).code === 11000) return { ok: false, reason: "taken" };
    return { ok: false, reason: "unavailable" };
  }

  const token = await startSession(store.sessions, usernameLower);
  return { ok: true, username, token };
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const store = await collections();
  if (!store) return { ok: false, reason: "unavailable" };

  const account = await store.accounts.findOne({ usernameLower: username.toLowerCase() });
  // The same answer for an unknown name and a wrong password, so the form
  // cannot be used to find out who has an account here.
  if (!account) return { ok: false, reason: "credentials" };

  const valid = await verifyPassword(password, {
    hash: account.passwordHash,
    salt: account.passwordSalt,
  });
  if (!valid) return { ok: false, reason: "credentials" };

  const token = await startSession(store.sessions, account.usernameLower);
  return { ok: true, username: account.username, token };
}

export async function accountForToken(token: string | undefined): Promise<Account | null> {
  if (!token) return null;

  const store = await collections();
  if (!store) return null;

  const session = await store.sessions.findOne({ tokenHash: tokenHash(token) });
  // The TTL index sweeps expired rows eventually; this check makes sure a
  // stale one is never honoured in the meantime.
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  const account = await store.accounts.findOne({ usernameLower: session.usernameLower });
  if (!account) return null;

  return { username: account.username, createdAt: account.createdAt.toISOString() };
}

export async function endSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const store = await collections();
  if (!store) return;
  await store.sessions.deleteOne({ tokenHash: tokenHash(token) });
}

export async function loadHistory(username: string): Promise<unknown | null> {
  const store = await collections();
  if (!store) return null;
  const found = await store.histories.findOne({ usernameLower: username.toLowerCase() });
  return found?.payload ?? null;
}

export async function saveHistory(username: string, payload: unknown): Promise<boolean> {
  const store = await collections();
  if (!store) return false;
  await ensureIndexes(store.db);

  try {
    await store.histories.updateOne(
      { usernameLower: username.toLowerCase() },
      { $set: { payload, updatedAt: new Date() } },
      { upsert: true },
    );
    return true;
  } catch {
    return false;
  }
}
