import assert from "node:assert/strict";
import { test } from "node:test";
import { hasEnoughContext, isCleanForLanguage } from "./reasoning";
import { emptyLifeContext } from "../types/life-context";

test("empty context is treated as insufficient information", () => {
  assert.equal(hasEnoughContext(emptyLifeContext()), false);
});

test("a single extracted fact is enough to reason about", () => {
  const context = emptyLifeContext();
  context.profile = { age: 42 };
  assert.equal(hasEnoughContext(context), true);
});

test("rejects Myanmar output contaminated with other scripts", () => {
  assert.equal(isCleanForLanguage("မမျှော်လင့်的长 တွေ့ရမည့်", "my"), false);
  assert.equal(isCleanForLanguage("ပညာရေးအတွက် ဘယ်လောက် စုထားပြီးပြီလဲ။", "my"), true);
});

test("English output is never rejected by the script guard", () => {
  assert.equal(isCleanForLanguage("How many months of expenses?", "en"), true);
});
