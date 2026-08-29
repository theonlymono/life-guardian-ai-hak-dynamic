import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeCommitments, mergeProfile, rejectUnrelatedCommitmentEdits } from "./context-merge";
import type { FinancialCommitment } from "../types/life-context";

const MORTGAGE: FinancialCommitment[] = [
  {
    id: "c1",
    type: "mortgage",
    amount: 300_000_000,
    currency: "MMK",
    description: "Existing mortgage",
  },
];

test("a corrected balance replaces the old one instead of sitting beside it", () => {
  const merged = mergeCommitments(MORTGAGE, [
    { type: "mortgage", amount: 250_000_000, currency: "MMK", description: "Remaining balance" },
  ]);

  assert.equal(merged.length, 1, "two balances for one mortgage is unreadable");
  assert.equal(merged[0].amount, 250_000_000);
});

test("an answer about education cannot rewrite the mortgage", () => {
  const kept = rejectUnrelatedCommitmentEdits(
    MORTGAGE,
    [{ type: "mortgage", amount: 300_000, description: "Misread education savings" }],
    "education_savings",
  );
  assert.deepEqual(kept, []);
});

test("an answer about the mortgage may correct the mortgage", () => {
  const kept = rejectUnrelatedCommitmentEdits(
    MORTGAGE,
    [{ type: "mortgage", amount: 250_000_000, description: "Updated balance" }],
    "mortgage_balance",
  );
  assert.equal(kept.length, 1);
});

test("a commitment we have never held is always accepted", () => {
  const kept = rejectUnrelatedCommitmentEdits(
    MORTGAGE,
    [{ type: "education_savings", amount: 300_000, description: "Saved so far" }],
    "education_savings",
  );
  assert.equal(kept.length, 1);
});

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
