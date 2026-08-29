import assert from "node:assert/strict";
import { test } from "node:test";
import { simulateGoal, type GoalInputs } from "./goal";

// 150 သိန်း saved, 300 သိန်း needed, 5 သိန်း a month, university in 2 years.
const EDUCATION: GoalInputs = {
  goalKey: "education_fund",
  currency: "MMK",
  targetAmount: 30_000_000,
  currentAmount: 15_000_000,
  monthlyContribution: 500_000,
  monthsRemaining: 24,
};

test("projects the pace the customer actually stated", () => {
  const result = simulateGoal(EDUCATION);
  assert.equal(result.projected, 27_000_000);
  assert.equal(result.gap, 3_000_000);
  assert.equal(result.onTrack, false);
});

test("names the monthly amount that would close the gap in time", () => {
  const result = simulateGoal(EDUCATION);
  assert.equal(result.requiredMonthly, 625_000);

  const required = result.scenarios.find((item) => item.kind === "required_pace");
  assert.ok(required?.reachesGoal, "the required pace must actually reach the goal");
});

test("offers more time as the alternative to more money", () => {
  const result = simulateGoal(EDUCATION);
  const moreTime = result.scenarios.find((item) => item.kind === "more_time");
  assert.equal(moreTime?.monthsRemaining, 30);
  assert.equal(moreTime?.reachesGoal, true);
});

test("a customer already on track is not handed a gap to worry about", () => {
  const result = simulateGoal({ ...EDUCATION, monthlyContribution: 700_000 });
  assert.equal(result.gap, 0);
  assert.equal(result.onTrack, true);
  assert.equal(result.scenarios.length, 1, "no rescue scenarios when none are needed");
});

test("saving nothing is projected honestly rather than as an error", () => {
  const result = simulateGoal({ ...EDUCATION, monthlyContribution: 0 });
  assert.equal(result.projected, 15_000_000);
  assert.equal(result.gap, 15_000_000);
  assert.equal(result.monthsAtCurrentPace, undefined, "zero a month never arrives");
  assert.equal(
    result.scenarios.some((item) => item.kind === "more_time"),
    false,
    "more time cannot rescue a pace of zero",
  );
});

test("no compounding is assumed anywhere", () => {
  const result = simulateGoal(EDUCATION);
  // 15,000,000 + 500,000 x 24 exactly. Any return assumption would inflate it.
  assert.equal(result.projected, 15_000_000 + 500_000 * 24);
});

test("a goal already met needs no further contributions", () => {
  const result = simulateGoal({ ...EDUCATION, currentAmount: 30_000_000 });
  assert.equal(result.requiredMonthly, 0);
  assert.equal(result.monthsAtCurrentPace, 0);
  assert.equal(result.onTrack, true);
});

test("a deadline already reached asks for the whole shortfall now", () => {
  const result = simulateGoal({ ...EDUCATION, monthsRemaining: 0 });
  assert.equal(result.requiredMonthly, 15_000_000);
});
