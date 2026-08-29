import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dropUnsupportedNumbers,
  generateSummary,
  hasEnoughContext,
  isCleanForLanguage,
} from "./reasoning";
import type { AnswerInterpretation } from "./schemas";
import { emptyLifeContext } from "../types/life-context";
import { calculateRisks } from "../risk/engine";
import type { LifeContext, SupportedLanguage } from "../types/life-context";

/** The demo scenario, scored by the real engine so the fallback has risks to rank. */
function scoredContext(language: SupportedLanguage): LifeContext {
  const context = emptyLifeContext();
  context.profile = { age: 42, dependents: 2, incomeStructure: "single_income" };
  context.lifeEvents = [
    {
      id: "e1",
      type: "education",
      description: "Oldest child enters university",
      timeHorizon: "2 years",
      evidence: "stated",
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
  context.completedActions = Array.from({ length: 5 }, (_, index) => ({
    actionId: `a${index}`,
    focus: "Financial Resilience",
    question: `Question ${index}`,
    answer: index,
    completedAt: new Date().toISOString(),
    topicKey: `topic_${index}`,
  }));
  context.risks = calculateRisks(context, language);
  return context;
}

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

function interpretation(overrides: Partial<AnswerInterpretation> = {}): AnswerInterpretation {
  return {
    interpretedAnswer: 0,
    profileUpdates: {},
    newLifeEvents: [],
    newCommitments: [],
    resolvedUnknowns: ["emergency savings"],
    newlyUnknown: [],
    ...overrides,
  };
}

test("a vague answer is never recorded as the number zero", () => {
  const cleaned = dropUnsupportedNumbers(
    interpretation({
      newCommitments: [
        { type: "emergency_savings", amount: 0, description: "Emergency savings" },
      ],
    }),
    "It is something I am working on.",
  );

  assert.equal(cleaned.interpretedAnswer, "It is something I am working on.");
  assert.deepEqual(cleaned.newCommitments, []);
  // Still unanswered, so the loop may ask about it again.
  assert.deepEqual(cleaned.resolvedUnknowns, []);
});

test("a real figure survives untouched in either language", () => {
  for (const answer of ["2", "About two months", "၂ လ", "I have none saved", "မရှိပါဘူး"]) {
    const cleaned = dropUnsupportedNumbers(interpretation({ interpretedAnswer: 2 }), answer);
    assert.equal(cleaned.interpretedAnswer, 2, `lost the figure in "${answer}"`);
    assert.deepEqual(cleaned.resolvedUnknowns, ["emergency savings"]);
  }
});

test("a numeric answer from the UI is always trusted", () => {
  const cleaned = dropUnsupportedNumbers(interpretation({ interpretedAnswer: 0 }), 0);
  assert.equal(cleaned.interpretedAnswer, 0);
});

test("an age the customer never stated is not invented from a vague reply", () => {
  const cleaned = dropUnsupportedNumbers(
    interpretation({ interpretedAnswer: "yes", profileUpdates: { age: 42, dependents: 2 } }),
    "Yes, that is right.",
  );
  assert.equal(cleaned.profileUpdates.age, undefined);
  assert.equal(cleaned.profileUpdates.dependents, undefined);
});

test("rejects a single foreign glyph hidden inside a Burmese word", () => {
  // Gemini has produced this exact leak: Gurmukhi ਕ inside "တက္ကသိုလ်".
  assert.equal(isCleanForLanguage("နောက်နှစ်နှစ်အတွင်း တက္ਕသိုလ်တက်မည်", "my"), false);
});

test("rejects Burmese leaking into English output", () => {
  assert.equal(isCleanForLanguage("Your mortgage ကျန်ရှိနေသည်", "en"), false);
});

test("rejects Burmese output that copied English source text", () => {
  assert.equal(
    isCleanForLanguage("single income, mortgage နှင့် thin savings များကြောင့်", "my"),
    false,
  );
});

test("Burmese output keeps its amounts, currency codes and names", () => {
  assert.equal(
    isCleanForLanguage("JPY 35000000 တန်ဖိုးရှိ အိမ်ချေးငွေကို ၂ နှစ်အတွင်း ဆပ်ရန်", "my"),
    true,
  );
  assert.equal(isCleanForLanguage("Life Guardian AI က ဒီအချက်ကို မှတ်ထားပါတယ်။", "my"), true);
});

// The model is rate-limited often enough on a free key that the fallback is
// what a demo audience may actually read. It has to stand on its own.
test("the offline summary ranks real categories instead of leaking enum keys", async () => {
  const { summary } = await generateSummary(scoredContext("en"), "en");

  assert.ok(summary.priorities.length >= 1);
  assert.equal(summary.headline.includes("?"), false);
  for (const priority of summary.priorities) {
    assert.equal(/^(finance|healthCare|education|housing|family)$/.test(priority.focus), false);
    assert.ok(priority.why.length > 0);
  }
  assert.match(summary.caution, /qualified professional/);
});

test("the offline plan gives ordered steps with deadlines and a reason each", async () => {
  const { summary } = await generateSummary(scoredContext("en"), "en");

  assert.ok(summary.plan.length >= 2, "a plan of one step is not a plan");
  const seen = new Set<string>();
  for (const step of summary.plan) {
    assert.ok(step.timeframe.length > 0, "every step needs a deadline");
    assert.ok(step.basedOn.length > 0, "every step must trace back to an answer");
    // A step that only says "consider your options" is not actionable.
    assert.ok(step.detail.split(" ").length > 8);
    assert.equal(seen.has(step.title), false, "steps must not repeat");
    seen.add(step.title);
  }
  // The most urgent risk is addressed first.
  assert.equal(summary.plan[0].timeframe, "This week");
});

test("the offline plan never tells the customer to buy a financial product", async () => {
  for (const language of ["en", "my"] as const) {
    const { summary } = await generateSummary(scoredContext(language), language);
    const text = summary.plan.map((step) => `${step.title} ${step.detail}`).join(" ");
    assert.doesNotMatch(text, /\b(buy|purchase|sign up for|invest in|switch to)\b/i);
  }
});

test("the offline summary is written in Burmese when Burmese is requested", async () => {
  const { summary } = await generateSummary(scoredContext("my"), "my");
  const text = [
    summary.headline,
    summary.situation,
    summary.caution,
    ...summary.priorities.map((item) => `${item.focus} ${item.why}`),
    ...summary.plan.map((step) => `${step.title} ${step.detail} ${step.timeframe} ${step.basedOn}`),
  ].join(" ");

  assert.match(text, /[\u1000-\u109F]/);
  assert.equal(/\d/.test(summary.situation), false, "Burmese copy should use Burmese numerals");
  assert.equal(isCleanForLanguage(text, "my"), true);
});
