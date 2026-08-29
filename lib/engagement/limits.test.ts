import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_ENGAGEMENT_QUESTIONS,
  hasReachedQuestionLimit,
  questionsRemaining,
} from "./limits";
import { emptyLifeContext } from "../types/life-context";
import type { CompletedAction, LifeContext } from "../types/life-context";

function withAnswers(count: number): LifeContext {
  const context = emptyLifeContext();
  context.completedActions = Array.from({ length: count }, (_, index): CompletedAction => ({
    actionId: `a${index}`,
    focus: "Financial Resilience",
    question: `Question ${index}`,
    answer: index,
    completedAt: new Date().toISOString(),
    topicKey: `topic_${index}`,
  }));
  return context;
}

test("the loop keeps asking until the fifth answer lands", () => {
  for (let answered = 0; answered < MAX_ENGAGEMENT_QUESTIONS; answered += 1) {
    assert.equal(hasReachedQuestionLimit(withAnswers(answered)), false);
    assert.equal(questionsRemaining(withAnswers(answered)), MAX_ENGAGEMENT_QUESTIONS - answered);
  }
});

test("the loop stops asking once five questions are answered", () => {
  assert.equal(hasReachedQuestionLimit(withAnswers(MAX_ENGAGEMENT_QUESTIONS)), true);
  assert.equal(questionsRemaining(withAnswers(MAX_ENGAGEMENT_QUESTIONS)), 0);
});

test("extra answers never push the remaining count below zero", () => {
  assert.equal(questionsRemaining(withAnswers(MAX_ENGAGEMENT_QUESTIONS + 4)), 0);
  assert.equal(hasReachedQuestionLimit(withAnswers(MAX_ENGAGEMENT_QUESTIONS + 4)), true);
});
