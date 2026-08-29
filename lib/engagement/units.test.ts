import assert from "node:assert/strict";
import { test } from "node:test";
import type { DailyAction } from "../types/life-context";
import { unitForTopic, withUnitHint } from "./units";

function numeric(topicKey: string | undefined, unitHint?: string): DailyAction {
  return {
    id: "a1",
    focus: "Finance",
    title: "t",
    reason: "r",
    actionType: "numeric_input",
    question: "q",
    unitHint,
    estimatedMinutes: 1,
    expectedImpact: "i",
    topicKey,
  };
}

test("a month count is never labelled as money", () => {
  assert.equal(unitForTopic("emergency_fund_months", "my", "MMK"), "လ");
  assert.equal(unitForTopic("emergency_fund_months", "en", "MMK"), "months");
});

test("a monthly amount is money, not a count of months", () => {
  assert.equal(unitForTopic("monthly_saving_capacity", "my", "MMK"), "သိန်း");
  assert.equal(unitForTopic("monthly_saving_capacity", "en", "MMK"), "lakh");
});

test("kyat is offered in the unit each language counts it in", () => {
  assert.equal(unitForTopic("education_savings", "my", "MMK"), "သိန်း");
  assert.equal(unitForTopic("education_savings", "en", "MMK"), "lakh");
  assert.equal(unitForTopic("education_savings", "en", "JPY"), "JPY");
});

test("the topic overrules a unit the model made up", () => {
  const action = withUnitHint(numeric("emergency_fund_months", "သိန်း"), "my", "MMK");
  assert.equal(action.unitHint, "လ", "asking for months under a money label misreads the answer");
});

test("an unlabelable number becomes free text rather than a guessed scale", () => {
  const action = withUnitHint(numeric("current_pressure"), "en", "MMK");
  assert.equal(action.actionType, "text_question");
  assert.equal(action.unitHint, undefined);
});

test("a model-supplied unit is kept when the topic implies none", () => {
  const action = withUnitHint(numeric("weekly_checkins", "times"), "en", "MMK");
  assert.equal(action.actionType, "numeric_input");
  assert.equal(action.unitHint, "times");
});

test("non-numeric actions are left alone", () => {
  const confirmation: DailyAction = { ...numeric("elder_care_shared"), actionType: "confirmation" };
  assert.deepEqual(withUnitHint(confirmation, "my", "MMK"), confirmation);
});
