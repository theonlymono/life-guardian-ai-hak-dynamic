/**
 * Straight-line savings arithmetic for a goal the customer has described.
 *
 * There is deliberately no interest or investment-return assumption here. We
 * do not know what return this customer can get, and picking one would quietly
 * invent the most consequential figure in the projection. Contributions are
 * counted, nothing is compounded, and every number below traces back to
 * something the customer typed.
 */

export type GoalKey = "education_fund" | "retirement_fund";

export interface GoalInputs {
  goalKey: GoalKey;
  currency: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  monthsRemaining: number;
}

export type ScenarioKind = "current_pace" | "required_pace" | "more_time";

export interface GoalScenario {
  kind: ScenarioKind;
  monthlyContribution: number;
  monthsRemaining: number;
  projected: number;
  gap: number;
  reachesGoal: boolean;
}

export interface GoalSimulation extends GoalInputs {
  projected: number;
  gap: number;
  /** Monthly amount that would close the gap in the time left. */
  requiredMonthly: number;
  /** Months their current pace would actually need. Undefined if never. */
  monthsAtCurrentPace?: number;
  onTrack: boolean;
  scenarios: GoalScenario[];
}

export function projectTotal(
  currentAmount: number,
  monthlyContribution: number,
  months: number,
): number {
  return Math.round(currentAmount + Math.max(0, monthlyContribution) * Math.max(0, months));
}

function scenario(
  kind: ScenarioKind,
  inputs: GoalInputs,
  monthlyContribution: number,
  monthsRemaining: number,
): GoalScenario {
  const projected = projectTotal(inputs.currentAmount, monthlyContribution, monthsRemaining);
  const gap = Math.max(0, inputs.targetAmount - projected);
  return {
    kind,
    monthlyContribution: Math.round(monthlyContribution),
    monthsRemaining: Math.round(monthsRemaining),
    projected,
    gap,
    reachesGoal: gap === 0,
  };
}

export function simulateGoal(inputs: GoalInputs): GoalSimulation {
  const projected = projectTotal(
    inputs.currentAmount,
    inputs.monthlyContribution,
    inputs.monthsRemaining,
  );
  const gap = Math.max(0, inputs.targetAmount - projected);
  const shortfall = Math.max(0, inputs.targetAmount - inputs.currentAmount);

  const requiredMonthly =
    inputs.monthsRemaining > 0 ? Math.ceil(shortfall / inputs.monthsRemaining) : shortfall;

  const monthsAtCurrentPace =
    shortfall === 0
      ? 0
      : inputs.monthlyContribution > 0
        ? Math.ceil(shortfall / inputs.monthlyContribution)
        : undefined;

  const scenarios: GoalScenario[] = [
    scenario("current_pace", inputs, inputs.monthlyContribution, inputs.monthsRemaining),
  ];

  if (gap > 0) {
    scenarios.push(scenario("required_pace", inputs, requiredMonthly, inputs.monthsRemaining));
    // Only worth showing when their own pace gets there eventually.
    if (monthsAtCurrentPace !== undefined) {
      scenarios.push(
        scenario("more_time", inputs, inputs.monthlyContribution, monthsAtCurrentPace),
      );
    }
  }

  return {
    ...inputs,
    projected,
    gap,
    requiredMonthly,
    monthsAtCurrentPace,
    onTrack: gap === 0,
    scenarios,
  };
}
