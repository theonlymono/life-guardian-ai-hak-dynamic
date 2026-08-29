import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeRequestSchema, extractionResultSchema } from "./schemas";

test("english analyze request validation", () => {
  const parsed = analyzeRequestSchema.safeParse({
    language: "en",
    input: "I'm 42 and I have two children.",
  });
  assert.equal(parsed.success, true);
});

test("myanmar analyze request validation", () => {
  const parsed = analyzeRequestSchema.safeParse({
    language: "my",
    input: "ကျွန်တော် အသက် ၄၂ နှစ်ရှိပါပြီ။",
  });
  assert.equal(parsed.success, true);
});

test("rejects empty analyze input", () => {
  const parsed = analyzeRequestSchema.safeParse({ language: "en", input: "   " });
  assert.equal(parsed.success, false);
});

test("rejects malformed model output", () => {
  const parsed = extractionResultSchema.safeParse({
    profile: { age: "forty-two" },
    lifeEvents: "nope",
  });
  assert.equal(parsed.success, false);
});
