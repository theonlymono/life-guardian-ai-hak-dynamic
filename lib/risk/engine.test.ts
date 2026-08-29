import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateRisks, detectMatchedRules, parseYearHorizon } from "./engine";
import { capScore, riskLevelFromScore } from "./rules";
import { emptyLifeContext } from "../types/life-context";

test("time horizons written as words parse like digits", () => {
  assert.equal(parseYearHorizon("2 years"), 2);
  assert.equal(parseYearHorizon("two years"), 2);
  assert.equal(parseYearHorizon("in two years"), 2);
  assert.equal(parseYearHorizon("next year"), 1);
  assert.equal(parseYearHorizon("six months"), 0.5);
  assert.equal(parseYearHorizon("နှစ်နှစ်"), 2);
  assert.equal(parseYearHorizon("soon"), 0);
});

test("risk level boundaries", () => {
  assert.equal(riskLevelFromScore(0), "LOW");
  assert.equal(riskLevelFromScore(29), "LOW");
  assert.equal(riskLevelFromScore(30), "MEDIUM");
  assert.equal(riskLevelFromScore(59), "MEDIUM");
  assert.equal(riskLevelFromScore(60), "HIGH");
  assert.equal(riskLevelFromScore(79), "HIGH");
  assert.equal(riskLevelFromScore(80), "CRITICAL");
  assert.equal(riskLevelFromScore(100), "CRITICAL");
});

test("scores are capped at 100", () => {
  assert.equal(capScore(140), 100);
  assert.equal(capScore(-4), 0);
});

test("primary demo scenario raises education, finance, family, housing, and care", () => {
  const context = emptyLifeContext();
  context.profile = { age: 42, dependents: 2, incomeStructure: "single_income" };
  context.lifeEvents = [
    {
      id: "e1",
      type: "education",
      description: "Oldest child enters university",
      timeHorizon: "2 years",
      evidence: "explicit",
    },
    {
      id: "e2",
      type: "elder_care",
      description: "Father is 78 and may need care soon",
      evidence: "explicit",
    },
  ];
  context.commitments = [
    {
      id: "c1",
      type: "mortgage",
      amount: 35_000_000,
      currency: "JPY",
      description: "Existing mortgage",
    },
  ];

  const matched = detectMatchedRules(context);
  assert.equal(matched.has("single_income"), true);
  assert.equal(matched.has("two_plus_dependents"), true);
  assert.equal(matched.has("major_mortgage"), true);
  assert.equal(matched.has("education_within_3_years"), true);
  assert.equal(matched.has("aging_parent_70_plus"), true);

  const risks = calculateRisks(context, "en");
  const byCategory = Object.fromEntries(risks.map((item) => [item.category, item]));
  assert.equal(byCategory.finance.score, 65);
  assert.equal(byCategory.finance.level, "HIGH");
  assert.equal(byCategory.education.score, 30);
  assert.equal(byCategory.housing.score, 20);
  assert.equal(byCategory.healthCare.score, 20);
  assert.equal(byCategory.family.score, 25);
});

test("job loss does not invent a mortgage amount", () => {
  const context = emptyLifeContext();
  context.profile = { dependents: 2 };
  context.lifeEvents = [
    {
      id: "e1",
      type: "job_loss",
      description: "Lost job yesterday",
      evidence: "explicit",
    },
  ];
  context.commitments = [
    { id: "c1", type: "mortgage", description: "Existing mortgage" },
  ];
  const matched = detectMatchedRules(context);
  assert.equal(matched.has("job_income_loss"), true);
  assert.equal(matched.has("major_mortgage"), true);
  assert.equal(context.commitments[0].amount, undefined);
});

test("pregnancy does not invent a mortgage", () => {
  const context = emptyLifeContext();
  context.lifeEvents = [
    {
      id: "e1",
      type: "pregnancy",
      description: "Expecting first baby",
      evidence: "explicit",
    },
  ];
  const matched = detectMatchedRules(context);
  assert.equal(matched.has("new_baby_or_pregnancy"), true);
  assert.equal(matched.has("major_mortgage"), false);
});
