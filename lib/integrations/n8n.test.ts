import assert from "node:assert/strict";
import { test } from "node:test";
import { triggerFollowUp } from "./n8n";
import { emptyLifeContext } from "../types/life-context";

test("n8n failure is unavailable and does not throw", async () => {
  const previous = process.env.N8N_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;
  process.env.N8N_WEBHOOK_URL = "https://example.invalid/webhook/life-guardian";
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  try {
    const result = await triggerFollowUp({
      sessionId: "demo-user-001",
      language: "en",
      context: emptyLifeContext(),
    });
    assert.equal(result.success, false);
    assert.equal(result.workflowStatus, "unavailable");
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.N8N_WEBHOOK_URL;
    else process.env.N8N_WEBHOOK_URL = previous;
  }
});

test("missing n8n url is unavailable", async () => {
  const previous = process.env.N8N_WEBHOOK_URL;
  delete process.env.N8N_WEBHOOK_URL;
  try {
    const result = await triggerFollowUp({
      sessionId: "demo-user-001",
      context: emptyLifeContext(),
    });
    assert.equal(result.success, false);
    assert.equal(result.workflowStatus, "unavailable");
  } finally {
    if (previous !== undefined) process.env.N8N_WEBHOOK_URL = previous;
  }
});
