import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getApiKeys, shouldTryNextKey } from "./client";

const KEY_VARS = [
  "AI_API_KEYS",
  "GEMINI_API_KEYS",
  "AI_API_KEY",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "NETLIFY_AI_GATEWAY_KEY",
] as const;

const saved = new Map(KEY_VARS.map((name) => [name, process.env[name]]));

afterEach(() => {
  for (const [name, value] of saved) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function only(vars: Partial<Record<(typeof KEY_VARS)[number], string>>): void {
  for (const name of KEY_VARS) delete process.env[name];
  for (const [name, value] of Object.entries(vars)) process.env[name] = value;
}

test("reads a comma-separated pool in the order it was written", () => {
  only({ AI_API_KEYS: "first,second,third" });
  assert.deepEqual(getApiKeys(), ["first", "second", "third"]);
});

test("tolerates spaces and newlines between keys", () => {
  only({ AI_API_KEYS: "first, second\nthird " });
  assert.deepEqual(getApiKeys(), ["first", "second", "third"]);
});

test("keeps a key once when the pool also names it singly", () => {
  only({ AI_API_KEYS: "first,second", AI_API_KEY: "first" });
  assert.deepEqual(getApiKeys(), ["first", "second"]);
});

test("still works for a deployment that only set one key", () => {
  only({ GEMINI_API_KEY: "solo" });
  assert.deepEqual(getApiKeys(), ["solo"]);
});

test("reports no keys when none are configured", () => {
  only({});
  assert.deepEqual(getApiKeys(), []);
});

test("moves to the next key when one is out of quota or refused", () => {
  for (const status of [429, 401, 403]) {
    assert.equal(shouldTryNextKey({ status }), true, `status ${status}`);
  }
  assert.equal(shouldTryNextKey(new Error("Quota exceeded for this project")), true);
  assert.equal(shouldTryNextKey(new Error("API key not valid")), true);
});

test("moves on from the 400 Gemini uses to reject a key", () => {
  assert.equal(shouldTryNextKey({ status: 400, message: "400 status code (no body)" }), true);
});

test("stays on the same key for failures another key cannot fix", () => {
  for (const status of [404, 500, 503]) {
    assert.equal(shouldTryNextKey({ status }), false, `status ${status}`);
  }
  assert.equal(shouldTryNextKey(new Error("EMPTY_AI_CONTENT")), false);
  assert.equal(shouldTryNextKey(new Error("INVALID_AI_JSON")), false);
  assert.equal(shouldTryNextKey(undefined), false);
});
