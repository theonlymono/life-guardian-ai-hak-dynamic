import type { LifeContext } from "@/lib/types/life-context";
import { parseYearHorizon } from "@/lib/risk/engine";
import { simulateGoal, type GoalInputs, type GoalKey, type GoalSimulation } from "./goal";

/**
 * Topic keys the loop uses to collect each simulation input. They are fixed
 * rather than model-chosen: a projection is only worth showing if we can point
 * at the exact answer every figure in it came from.
 */
export const GOAL_TOPICS: Record<GoalKey, { target: string; current: string; monthly: string }> = {
  education_fund: {
    target: "education_target",
    current: "education_savings",
    monthly: "monthly_saving_capacity",
  },
  retirement_fund: {
    target: "retirement_target",
    current: "retirement_savings",
    monthly: "monthly_saving_capacity",
  },
};

export type GoalInputKind = "target" | "current" | "monthly" | "horizon";

export interface GoalProgress {
  goalKey: GoalKey;
  currency: string;
  simulation?: GoalSimulation;
  /** Inputs still needed before a projection can be shown. */
  missing: GoalInputKind[];
  /** The topic key to ask for next, or undefined once nothing is missing. */
  nextTopicKey?: string;
}

const EDUCATION = /education|university|school|ပညာရေး|တက္ကသိုလ်|ကျောင်း/i;
const RETIREMENT = /retire|pension|အငြိမ်းစား|ပင်စင်/i;

/**
 * Picks the one goal worth projecting and reports what is still missing.
 *
 * Only goals anchored to a dated life event qualify. Without a deadline there
 * is no gap to compute, only a number floating free of the customer's life.
 */
export function resolveGoalProgress(context: LifeContext): GoalProgress | undefined {
  return goalFor(context, "education_fund") ?? goalFor(context, "retirement_fund");
}

function goalFor(context: LifeContext, goalKey: GoalKey): GoalProgress | undefined {
  const months = monthsRemaining(context, goalKey);
  if (months === undefined) return undefined;

  const topics = GOAL_TOPICS[goalKey];
  const target = statedAmount(context, topics.target);
  const current = statedAmount(context, topics.current);
  const monthly = statedAmount(context, topics.monthly);

  // Asked in the order the customer would think about it: what they have,
  // what it needs to be, what they can add each month.
  const missing: GoalInputKind[] = [];
  if (current === undefined) missing.push("current");
  if (target === undefined) missing.push("target");
  if (monthly === undefined) missing.push("monthly");

  const currency = statedCurrency(context) ?? "MMK";

  if (missing.length > 0) {
    return {
      goalKey,
      currency,
      missing,
      nextTopicKey: topics[missing[0] as "target" | "current" | "monthly"],
    };
  }

  const inputs: GoalInputs = {
    goalKey,
    currency,
    targetAmount: target as number,
    currentAmount: current as number,
    monthlyContribution: monthly as number,
    monthsRemaining: months,
  };

  return { goalKey, currency, simulation: simulateGoal(inputs), missing: [] };
}

/**
 * Education counts down to the event the customer described. Retirement counts
 * down from their age to the age they gave us — both dates they supplied.
 */
function monthsRemaining(context: LifeContext, goalKey: GoalKey): number | undefined {
  if (goalKey === "education_fund") {
    const event = context.lifeEvents.find((item) =>
      EDUCATION.test(`${item.type} ${item.description}`),
    );
    const years = event?.timeHorizon ? parseYearHorizon(event.timeHorizon) : undefined;
    return years === undefined ? undefined : Math.max(0, Math.round(years * 12));
  }

  const age = context.profile.age;
  const retirementAge = statedAmount(context, "retirement_age");
  const wantsRetirement =
    retirementAge !== undefined ||
    context.lifeEvents.some((item) => RETIREMENT.test(`${item.type} ${item.description}`));
  if (!wantsRetirement || age === undefined || retirementAge === undefined) return undefined;
  return Math.max(0, Math.round((retirementAge - age) * 12));
}

/** Reads a figure the customer stated, from their answers or their commitments. */
function statedAmount(context: LifeContext, topicKey: string): number | undefined {
  const answered = (context.completedActions ?? []).find(
    (item) => item.topicKey?.toLowerCase() === topicKey.toLowerCase(),
  );
  if (typeof answered?.answer === "number") return answered.answer;

  const commitment = context.commitments.find(
    (item) => item.type.toLowerCase() === topicKey.toLowerCase(),
  );
  return typeof commitment?.amount === "number" ? commitment.amount : undefined;
}

function statedCurrency(context: LifeContext): string | undefined {
  return context.commitments.find((item) => item.currency)?.currency;
}
