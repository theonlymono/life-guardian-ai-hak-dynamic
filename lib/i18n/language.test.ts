import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLanguage, resolveLanguage } from "./language";

test("detects myanmar script", () => {
  assert.equal(
    detectLanguage("ကျွန်တော် အသက် ၄၂ နှစ်ရှိပါပြီ။"),
    "my",
  );
});

test("defaults to english when language is omitted", () => {
  assert.equal(resolveLanguage(undefined, "I'm 42."), "en");
});

test("explicit language wins over detection", () => {
  assert.equal(resolveLanguage("en", "ကျွန်တော် အသက် ၄၂ နှစ်ရှိပါပြီ။"), "en");
});
