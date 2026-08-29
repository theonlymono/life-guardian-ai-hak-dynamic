import assert from "node:assert/strict";
import { test } from "node:test";
import { selectFallbackAction } from "./daily-action";
import { isRepeatedQuestion } from "./repetition";
import { emptyLifeContext } from "../types/life-context";

test("does not repeat a completed education savings question", () => {
  const context = emptyLifeContext();
  context.lifeEvents = [
    {
      id: "e1",
      type: "education",
      description: "Oldest child enters university",
      timeHorizon: "2 years",
      evidence: "explicit",
    },
  ];
  context.completedActions = [
    {
      actionId: "a1",
      focus: "Education Planning",
      question: "How much have you already saved for education?",
      answer: "¥1.5 million",
      completedAt: new Date().toISOString(),
      topicKey: "education_savings",
    },
  ];

  const next = selectFallbackAction(context, "en");
  assert.equal(next.topicKey === "education_savings", false);
  assert.equal(
    isRepeatedQuestion(
      { question: "How much have you already saved for education?", topicKey: "education_savings", focus: "Education Planning" },
      context,
    ),
    true,
  );
  assert.match(next.question.toLowerCase(), /months|expense|care|concern/);
});
