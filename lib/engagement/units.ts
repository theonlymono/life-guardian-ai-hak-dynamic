import type { DailyAction, SupportedLanguage } from "@/lib/types/life-context";
import { moneyUnit } from "@/lib/i18n/money";

/**
 * Units a topic key implies with certainty. The topic is the contract the rest
 * of the system reads — emergency_fund_months is a month count everywhere it
 * is used — so it decides the unit, not whoever wrote the question.
 */
const UNITS: Record<string, Record<SupportedLanguage, string>> = {
  months: { en: "months", my: "လ" },
  years: { en: "years", my: "နှစ်" },
  age: { en: "years old", my: "နှစ်" },
  people: { en: "people", my: "ဦး" },
};

export function unitForTopic(
  topicKey: string | undefined,
  language: SupportedLanguage,
  currency: string,
): string | undefined {
  if (!topicKey) return undefined;
  const key = topicKey.toLowerCase();
  // "monthly" is a rate of money, not a count of months.
  if (/month/.test(key) && !/monthly/.test(key)) return UNITS.months[language];
  if (/age|retirement/.test(key)) return UNITS.age[language];
  if (/year|horizon/.test(key)) return UNITS.years[language];
  if (/dependents|children/.test(key)) return UNITS.people[language];
  if (/saving|income|amount|cost|fund|debt|loan|expense|target|capacity/.test(key)) {
    return moneyUnit(currency, language);
  }
  return undefined;
}

/**
 * Guarantees the invariant every numeric answer depends on: a number the
 * customer types is only readable if the field said what it counts. Actions we
 * cannot label fall back to free text rather than inviting a guessed scale.
 */
export function withUnitHint(
  action: DailyAction,
  language: SupportedLanguage,
  currency: string,
): DailyAction {
  if (action.actionType !== "numeric_input") return action;

  const unitHint = unitForTopic(action.topicKey, language, currency) ?? action.unitHint;
  if (!unitHint) return { ...action, actionType: "text_question", unitHint: undefined };
  return { ...action, unitHint };
}

export function contextCurrency(
  commitments: { currency?: string }[] | undefined,
): string {
  return commitments?.find((item) => item.currency)?.currency ?? "MMK";
}
