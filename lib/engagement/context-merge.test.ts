import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeProfile } from "./context-merge";

test("a later unknown income structure does not erase a known one", () => {
  const merged = mergeProfile(
    { age: 42, dependents: 2, incomeStructure: "single_income" },
    { incomeStructure: "unknown" },
  );
  assert.equal(merged.incomeStructure, "single_income");
});

test("an explicit correction still replaces the income structure", () => {
  const merged = mergeProfile(
    { incomeStructure: "single_income" },
    { incomeStructure: "dual_income" },
  );
  assert.equal(merged.incomeStructure, "dual_income");
});

test("unknown is kept when nothing better is known", () => {
  assert.equal(mergeProfile({}, { incomeStructure: "unknown" }).incomeStructure, "unknown");
});

test("existing facts survive an update that omits them", () => {
  const merged = mergeProfile({ age: 42, dependents: 2 }, { dependents: 3 });
  assert.deepEqual(merged, { age: 42, dependents: 3 });
});
