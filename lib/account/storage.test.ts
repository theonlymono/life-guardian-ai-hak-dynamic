import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { emptyLifeContext } from "../types/life-context";
import type { Turn } from "../types/conversation";
import {
  clearAccountData,
  guestOwner,
  loadAccountData,
  parseStored,
  saveAccountData,
  upsert,
  userOwner,
  type Conversation,
} from "./storage";

// A minimal stand-in for the browser API the module reaches for.
function installStorage(): Map<string, string> {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  };
  return store;
}

function turn(overrides: Partial<Turn> = {}): Turn {
  return {
    id: "t1",
    kind: "analyze",
    userText: "I lost my job today",
    assistantText: "That raises your financial pressure.",
    riskMoves: [],
    changes: [],
    pending: false,
    failed: false,
    ...overrides,
  };
}

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "c1",
    title: "I lost my job today",
    language: "my",
    context: emptyLifeContext(),
    turns: [turn()],
    action: null,
    summary: null,
    simulation: null,
    answered: 2,
    savedAt: "2026-08-29T08:00:00.000Z",
    ...overrides,
  };
}

let store: Map<string, string>;
beforeEach(() => {
  store = installStorage();
});

test("a saved conversation comes back whole", () => {
  saveAccountData("acct_1", { conversations: [conversation()], activeId: "c1" });
  const loaded = loadAccountData("acct_1");

  assert.equal(loaded?.conversations.length, 1);
  assert.equal(loaded?.conversations[0].turns[0].userText, "I lost my job today");
  assert.equal(loaded?.conversations[0].language, "my");
  assert.equal(loaded?.conversations[0].answered, 2);
});

test("starting a new chat keeps the earlier ones", () => {
  const older = conversation({ id: "c1", savedAt: "2026-08-29T08:00:00.000Z" });
  const newer = conversation({
    id: "c2",
    title: "My father needs care",
    savedAt: "2026-08-29T09:00:00.000Z",
  });

  const conversations = upsert([older], newer);
  saveAccountData("acct_1", { conversations, activeId: "c2" });

  const loaded = loadAccountData("acct_1");
  assert.equal(loaded?.conversations.length, 2, "the earlier conversation must survive");
  assert.equal(loaded?.activeId, "c2");
});

test("the list is newest first", () => {
  saveAccountData("acct_1", {
    conversations: [
      conversation({ id: "old", savedAt: "2026-08-01T00:00:00.000Z" }),
      conversation({ id: "new", savedAt: "2026-08-29T00:00:00.000Z" }),
    ],
    activeId: "new",
  });

  assert.deepEqual(
    loadAccountData("acct_1")?.conversations.map((item) => item.id),
    ["new", "old"],
  );
});

test("editing a conversation updates it rather than duplicating it", () => {
  const first = conversation({ id: "c1", answered: 1 });
  const updated = conversation({ id: "c1", answered: 4 });

  const conversations = upsert([first], updated);
  assert.equal(conversations.length, 1);
  assert.equal(conversations[0].answered, 4);
});

test("one account cannot read another's history", () => {
  saveAccountData("acct_1", { conversations: [conversation()], activeId: "c1" });
  assert.equal(loadAccountData("acct_2"), null);
});

test("a turn interrupted by the reload is shown as failed, not still waiting", () => {
  saveAccountData("acct_1", {
    conversations: [conversation({ turns: [turn({ pending: true, assistantText: null })] })],
    activeId: "c1",
  });

  const restored = loadAccountData("acct_1")?.conversations[0].turns[0];
  assert.equal(restored?.pending, false);
  assert.equal(restored?.failed, true);
});

test("a session saved by the older single-conversation build is not discarded", () => {
  // The previous shape stored one conversation at the top level.
  const legacy = {
    language: "my",
    context: emptyLifeContext(),
    turns: [turn()],
    action: null,
    summary: null,
    simulation: null,
    title: "အလုပ်ကထွက်လိုက်ရတယ်",
    answered: 3,
    savedAt: "2026-08-29T07:00:00.000Z",
  };

  const parsed = parseStored(legacy);
  assert.equal(parsed?.conversations.length, 1);
  assert.equal(parsed?.conversations[0].title, "အလုပ်ကထွက်လိုက်ရတယ်");
  assert.equal(parsed?.conversations[0].answered, 3);
});

test("unreadable storage costs the history, not the ability to start", () => {
  store.set("life-guardian.session.acct_1", "{ not json");
  assert.equal(loadAccountData("acct_1"), null);
});

test("clearing removes everything for that account", () => {
  saveAccountData("acct_1", { conversations: [conversation()], activeId: "c1" });
  clearAccountData("acct_1");
  assert.equal(loadAccountData("acct_1"), null);
});

test("a guest and a signed-in account do not share a slot", () => {
  saveAccountData(guestOwner("acct_1"), {
    conversations: [conversation({ id: "guest-chat", title: "told as a guest" })],
    activeId: "guest-chat",
  });

  // Same browser, same local account id, different owner.
  assert.equal(loadAccountData(userOwner("alice")), null);
});

test("two people on the same browser cannot see each other's history", () => {
  saveAccountData(userOwner("alice"), {
    conversations: [conversation({ id: "a1", title: "Alice's mortgage" })],
    activeId: "a1",
  });
  saveAccountData(userOwner("bob"), {
    conversations: [conversation({ id: "b1", title: "Bob's retirement" })],
    activeId: "b1",
  });

  assert.equal(loadAccountData(userOwner("alice"))?.conversations[0].title, "Alice's mortgage");
  assert.equal(loadAccountData(userOwner("bob"))?.conversations[0].title, "Bob's retirement");
});

test("a username is matched case-insensitively, so Alice is not two people", () => {
  saveAccountData(userOwner("Alice"), {
    conversations: [conversation({ id: "a1" })],
    activeId: "a1",
  });
  assert.equal(loadAccountData(userOwner("alice"))?.conversations.length, 1);
});

test("signing out leaves nothing of that account on the device", () => {
  saveAccountData(userOwner("alice"), {
    conversations: [conversation({ id: "a1" })],
    activeId: "a1",
  });
  saveAccountData(guestOwner("acct_1"), {
    conversations: [conversation({ id: "g1" })],
    activeId: "g1",
  });

  clearAccountData(userOwner("alice"));

  assert.equal(loadAccountData(userOwner("alice")), null);
  assert.equal(
    loadAccountData(guestOwner("acct_1"))?.conversations.length,
    1,
    "the guest history on this device is a separate thing and stays",
  );
});
