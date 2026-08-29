import type { LifeContext } from "@/lib/types/life-context";

/**
 * The loop stops asking after this many answered questions and reports back
 * instead. An assistant that keeps asking forever stops feeling like it is
 * getting anywhere, and by five answers there is enough context to say
 * something useful about the customer's whole situation.
 */
export const MAX_ENGAGEMENT_QUESTIONS = 5;

export function questionsAnswered(context: LifeContext): number {
  return context.completedActions?.length ?? 0;
}

export function questionsRemaining(context: LifeContext): number {
  return Math.max(MAX_ENGAGEMENT_QUESTIONS - questionsAnswered(context), 0);
}

export function hasReachedQuestionLimit(context: LifeContext): boolean {
  return questionsAnswered(context) >= MAX_ENGAGEMENT_QUESTIONS;
}
