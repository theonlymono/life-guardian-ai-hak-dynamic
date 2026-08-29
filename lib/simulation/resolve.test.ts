import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyLifeContext, type LifeContext } from "../types/life-context";
import { resolveGoalProgress } from "./resolve";

function contextWith(overrides: Partial<LifeContext>): LifeContext {
  return { ...emptyLifeContext(), ...overrides };
}

const UNIVERSITY = {
  id: "e1",
  type: "education",
  description: "Oldest child enters university",
  timeHorizon: "2 years",
  evidence: "Stated by the customer.",
};

function answered(topicKey: string, answer: number) {
  return {
    actionId: `a-${topicKey}`,
    focus: "Education Planning",
    question: topicKey,
    answer,
    completedAt: new Date().toISOString(),
    topicKey,
  };
}

test("a goal with no date is not projected at all", () => {
  const progress = resolveGoalProgress(
    contextWith({ lifeEvents: [{ ...UNIVERSITY, timeHorizon: undefined }] }),
  );
  assert.equal(progress, undefined, "a gap without a deadline means nothing");
});

test("asks for what it has, then the target, then the pace", () => {
  const empty = resolveGoalProgress(contextWith({ lifeEvents: [UNIVERSITY] }));
  assert.deepEqual(empty?.missing, ["current", "target", "monthly"]);
  assert.equal(empty?.nextTopicKey, "education_savings");

  const withCurrent = resolveGoalProgress(
    contextWith({ lifeEvents: [UNIVERSITY], completedActions: [answered("education_savings", 1)] }),
  );
  assert.equal(withCurrent?.nextTopicKey, "education_target");
});

test("no projection is offered until every figure came from the customer", () => {
  const partial = resolveGoalProgress(
    contextWith({
      lifeEvents: [UNIVERSITY],
      completedActions: [answered("education_savings", 15_000_000), answered("education_target", 30_000_000)],
    }),
  );
  assert.equal(partial?.simulation, undefined);
  assert.deepEqual(partial?.missing, ["monthly"]);
});

test("projects once the customer has supplied all three figures", () => {
  const progress = resolveGoalProgress(
    contextWith({
      lifeEvents: [UNIVERSITY],
      completedActions: [
        answered("education_savings", 15_000_000),
        answered("education_target", 30_000_000),
        answered("monthly_saving_capacity", 500_000),
      ],
    }),
  );

  assert.equal(progress?.missing.length, 0);
  assert.equal(progress?.simulation?.monthsRemaining, 24, "two years is 24 months");
  assert.equal(progress?.simulation?.projected, 27_000_000);
  assert.equal(progress?.simulation?.gap, 3_000_000);
});

test("retirement needs both the age they are and the age they are aiming at", () => {
  const withoutTarget = resolveGoalProgress(
    contextWith({
      profile: { age: 55 },
      lifeEvents: [{ id: "e2", type: "retirement", description: "Plans to retire", evidence: "x" }],
    }),
  );
  assert.equal(withoutTarget, undefined);

  const progress = resolveGoalProgress(
    contextWith({
      profile: { age: 55 },
      lifeEvents: [{ id: "e2", type: "retirement", description: "Plans to retire", evidence: "x" }],
      completedActions: [answered("retirement_age", 60)],
    }),
  );
  assert.equal(progress?.goalKey, "retirement_fund");
  assert.deepEqual(progress?.missing, ["current", "target", "monthly"]);
});

test("kyat is the currency unless the customer named another one", () => {
  const kyat = resolveGoalProgress(contextWith({ lifeEvents: [UNIVERSITY] }));
  assert.equal(kyat?.currency, "MMK");

  const yen = resolveGoalProgress(
    contextWith({
      lifeEvents: [UNIVERSITY],
      commitments: [
        { id: "c1", type: "mortgage", amount: 35_000_000, currency: "JPY", description: "Loan" },
      ],
    }),
  );
  assert.equal(yen?.currency, "JPY");
});
