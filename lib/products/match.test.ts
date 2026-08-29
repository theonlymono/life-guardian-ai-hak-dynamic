import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyLifeContext, type LifeContext, type RiskScore } from "../types/life-context";
import { matchProducts } from "./match";

function risk(category: RiskScore["category"], score: number, level: RiskScore["level"]): RiskScore {
  return { category, score, level, explanation: "", contributingFactors: [] };
}

function contextWith(overrides: Partial<LifeContext>): LifeContext {
  return { ...emptyLifeContext(), ...overrides };
}

test("nothing is offered before there is anything to go on", () => {
  assert.deepEqual(matchProducts(emptyLifeContext(), "en"), []);
});

test("a low score is not turned into a reason to sell", () => {
  const matches = matchProducts(contextWith({ risks: [risk("finance", 15, "LOW")] }), "en");
  assert.deepEqual(matches, []);
});

test("an approaching university bill surfaces the education product", () => {
  const matches = matchProducts(
    contextWith({
      lifeEvents: [
        {
          id: "e1",
          type: "education",
          description: "Oldest child enters university",
          timeHorizon: "2 years",
          evidence: "x",
        },
      ],
      risks: [risk("education", 70, "HIGH")],
    }),
    "en",
  );

  assert.equal(matches[0]?.product.id, "edu_goal");
  assert.match(matches[0].reason, /education/i, "the reason must name what prompted it");
});

test("suggestions follow the risk order and never repeat a product", () => {
  const matches = matchProducts(
    contextWith({
      risks: [risk("finance", 80, "CRITICAL"), risk("healthCare", 60, "HIGH"), risk("education", 40, "MEDIUM")],
    }),
    "en",
  );

  assert.equal(matches.length, 3);
  assert.deepEqual(
    matches.map((item) => item.score),
    [80, 60, 40],
  );
  assert.equal(new Set(matches.map((item) => item.product.id)).size, 3);
});

test("at most three are shown, however many risks are high", () => {
  const matches = matchProducts(
    contextWith({
      risks: [
        risk("finance", 90, "CRITICAL"),
        risk("family", 80, "CRITICAL"),
        risk("healthCare", 70, "HIGH"),
        risk("education", 60, "HIGH"),
        risk("housing", 50, "MEDIUM"),
      ],
    }),
    "en",
  );
  assert.equal(matches.length, 3);
});

test("an age outside the published entry range is flagged, not hidden", () => {
  const matches = matchProducts(
    contextWith({ profile: { age: 70 }, risks: [risk("finance", 80, "CRITICAL")] }),
    "en",
  );
  assert.equal(matches[0]?.outsideEntryAge, true);
});

test("reasons are written in the customer's language", () => {
  const matches = matchProducts(contextWith({ risks: [risk("education", 70, "HIGH")] }), "my");
  assert.match(matches[0].reason, /[\u1000-\u109F]/, "a Burmese reader gets a Burmese reason");
});
