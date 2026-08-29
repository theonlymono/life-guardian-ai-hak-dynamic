import {
  answerInterpretationSchema,
  dailyActionDraftSchema,
  lifeSummarySchema,
  type AnswerInterpretation,
  type DailyActionDraft,
} from "@/lib/ai/schemas";
import { completeJson, isAiConfigured, isDemoBackupMode } from "@/lib/ai/client";
import {
  ACTION_SYSTEM,
  INTERPRET_SYSTEM,
  SUMMARY_SYSTEM,
  actionUserPrompt,
  interpretUserPrompt,
  summaryUserPrompt,
} from "@/lib/ai/prompts";
import { selectFallbackAction } from "@/lib/engagement/daily-action";
import { fallbackSummary } from "@/lib/engagement/summary-fallback";
import { hasNumericEvidence } from "@/lib/risk/engine";
import { myanmarDigitsToLatin, parseMoney } from "@/lib/i18n/money";
import {
  completedTopicKeys,
  fallbackPressureQuestion,
  isRepeatedQuestion,
  withActionId,
} from "@/lib/engagement/repetition";
import { demoAnswerInterpretation, demoDailyAction } from "@/lib/demo/backup";
import type {
  DailyAction,
  LifeContext,
  LifeSummary,
  SupportedLanguage,
} from "@/lib/types/life-context";

export function hasEnoughContext(context: LifeContext): boolean {
  return Boolean(
    context.profile.age ||
      context.profile.dependents !== undefined ||
      context.profile.incomeStructure === "single_income" ||
      context.lifeEvents.length > 0 ||
      context.commitments.length > 0 ||
      context.completedActions.length > 0,
  );
}

export async function generateDailyAction(
  context: LifeContext,
  language: SupportedLanguage,
): Promise<{ action: DailyAction; assistantMessage: string; source: "live_ai" | "demo_backup" }> {
  const fallback = selectFallbackAction(context, language);

  // Too little to reason about: ask the one clarifying question instead of guessing a topic.
  if (!hasEnoughContext(context)) {
    const pressure = fallbackPressureQuestion(language);
    return {
      action: pressure,
      assistantMessage: fallbackAssistantMessage(pressure, language),
      source: isAiConfigured() ? "live_ai" : "demo_backup",
    };
  }

  if (!isAiConfigured()) {
    if (isDemoBackupMode()) {
      const demo = demoDailyAction(context, language);
      return {
        action: demo.action,
        assistantMessage: demo.assistantMessage,
        source: "demo_backup",
      };
    }
    return {
      action: fallback,
      assistantMessage: fallbackAssistantMessage(fallback, language),
      source: "demo_backup",
    };
  }

  try {
    const raw = await completeJson(
      actionUserPrompt({
        language,
        contextJson: JSON.stringify({
          profile: context.profile,
          lifeEvents: context.lifeEvents,
          commitments: context.commitments,
          risks: context.risks,
          unknownImportantInformation: context.unknownImportantInformation,
          completedActions: context.completedActions,
        }),
        blockedTopics: completedTopicKeys(context),
        blockedQuestions: context.completedActions.map((item) => item.question),
      }),
      ACTION_SYSTEM,
    );
    const parsed = dailyActionDraftSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("INVALID_AI_RESPONSE");
    }
    const action = draftToAction(parsed.data, language);
    const draftText = [
      action.title,
      action.reason,
      action.question,
      action.expectedImpact,
      parsed.data.assistantMessage,
      ...(action.options ?? []),
    ].join(" ");

    if (isRepeatedQuestion(action, context) || !isCleanForLanguage(draftText, language)) {
      return {
        action: fallback,
        assistantMessage: fallbackAssistantMessage(fallback, language),
        source: "live_ai",
      };
    }
    return {
      action,
      assistantMessage: parsed.data.assistantMessage,
      source: "live_ai",
    };
  } catch {
    if (isDemoBackupMode()) {
      const demo = demoDailyAction(context, language);
      return {
        action: demo.action,
        assistantMessage: demo.assistantMessage,
        source: "demo_backup",
      };
    }
    return {
      action: fallback,
      assistantMessage: fallbackAssistantMessage(fallback, language),
      source: "live_ai",
    };
  }
}

/**
 * Produces the closing readout once the question limit is reached. The
 * deterministic fallback is built from the risk engine, so a summary is always
 * available even when the model is down.
 */
export async function generateSummary(
  context: LifeContext,
  language: SupportedLanguage,
): Promise<{ summary: LifeSummary; source: "live_ai" | "demo_backup" }> {
  const fallback = fallbackSummary(context, language);
  if (!isAiConfigured()) {
    return { summary: fallback, source: "demo_backup" };
  }

  try {
    const raw = await completeJson(
      summaryUserPrompt({
        language,
        answeredCount: context.completedActions.length,
        contextJson: JSON.stringify({
          profile: context.profile,
          lifeEvents: context.lifeEvents,
          commitments: context.commitments,
          risks: context.risks,
          completedActions: context.completedActions,
          unknownImportantInformation: context.unknownImportantInformation,
        }),
      }),
      SUMMARY_SYSTEM,
    );
    const parsed = lifeSummarySchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("INVALID_AI_RESPONSE");
    }

    const text = [
      parsed.data.headline,
      parsed.data.situation,
      parsed.data.caution,
      ...parsed.data.priorities.map((item) => `${item.focus} ${item.why}`),
      ...parsed.data.plan.map(
        (step) => `${step.title} ${step.detail} ${step.timeframe} ${step.basedOn}`,
      ),
    ].join(" ");
    if (!isCleanForLanguage(text, language)) {
      return { summary: fallback, source: "live_ai" };
    }
    return { summary: parsed.data, source: "live_ai" };
  } catch {
    return { summary: fallback, source: "live_ai" };
  }
}

/**
 * Sits above the summary card in the thread. Deliberately not the headline —
 * the card already carries that, and repeating it reads like a stutter.
 */
export function summaryLeadIn(language: SupportedLanguage): string {
  return language === "my"
    ? "မေးခွန်းများ ဖြေပြီးသွားပါပြီ။ သင်ပြောပြထားသမျှကို ပေါင်းစပ်ပြီး အခြေအနေ တစ်ခုလုံးကို အနှစ်ချုပ် ပြောပြပါမည်။"
    : "That is everything I need to ask. Here is what your answers add up to.";
}

export async function interpretAnswer(args: {
  language: SupportedLanguage;
  question: string;
  answer: string | number | boolean;
  topicKey?: string;
  unitHint?: string;
}): Promise<AnswerInterpretation> {
  if (!isAiConfigured()) {
    if (isDemoBackupMode()) {
      return demoAnswerInterpretation(args);
    }
    return heuristicInterpretation(args);
  }

  try {
    const raw = await completeJson(
      interpretUserPrompt(args),
      INTERPRET_SYSTEM,
    );
    const parsed = answerInterpretationSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("INVALID_AI_RESPONSE");
    }
    return dropUnsupportedNumbers(parsed.data, args.answer);
  } catch {
    return heuristicInterpretation(args);
  }
}

/**
 * Strips figures the model produced from an answer that contains no figure.
 *
 * Asked how many months of expenses they have saved, a customer who replies
 * "it's something I'm working on" has told us nothing, but the model reads it
 * as 0. Stored, that zero fires the emergency-savings rule, adds 25 to their
 * finance score, and comes back in the closing summary as "you have no
 * emergency savings" — a figure they never gave, presented as their own.
 */
export function dropUnsupportedNumbers(
  interpretation: AnswerInterpretation,
  answer: string | number | boolean,
): AnswerInterpretation {
  if (typeof answer !== "string" || hasNumericEvidence(answer)) return interpretation;

  const profileUpdates = { ...interpretation.profileUpdates };
  delete profileUpdates.age;
  delete profileUpdates.dependents;

  return {
    ...interpretation,
    interpretedAnswer:
      typeof interpretation.interpretedAnswer === "number"
        ? answer
        : interpretation.interpretedAnswer,
    profileUpdates,
    newCommitments: interpretation.newCommitments.filter(
      (commitment) => commitment.amount === undefined,
    ),
    // The question stays open: an answer without the figure has not resolved it.
    resolvedUnknowns: [],
  };
}

/** Units we can state with certainty from the topic alone. */
const TOPIC_UNITS: Record<string, Record<SupportedLanguage, string>> = {
  months: { en: "months", my: "လ" },
  years: { en: "years", my: "နှစ်" },
  age: { en: "years old", my: "နှစ်" },
  people: { en: "people", my: "ဦး" },
  money: { en: "MMK", my: "သိန်း" },
};

function unitForTopic(
  topicKey: string,
  language: SupportedLanguage,
): string | undefined {
  const key = topicKey.toLowerCase();
  if (/month/.test(key)) return TOPIC_UNITS.months[language];
  if (/age|retirement/.test(key)) return TOPIC_UNITS.age[language];
  if (/year/.test(key)) return TOPIC_UNITS.years[language];
  if (/dependents|children/.test(key)) return TOPIC_UNITS.people[language];
  if (/saving|income|amount|cost|fund|debt|loan/.test(key)) return TOPIC_UNITS.money[language];
  return undefined;
}

function draftToAction(draft: DailyActionDraft, language: SupportedLanguage): DailyAction {
  const numeric = draft.actionType === "numeric_input";
  const unitHint = numeric ? (draft.unitHint ?? unitForTopic(draft.topicKey, language)) : undefined;

  return withActionId({
    focus: draft.focus,
    title: draft.title,
    reason: draft.reason,
    // A number with no unit cannot be read back safely, and guessing the scale
    // is how a "3" becomes 300,000. If we cannot name the unit, let the
    // customer write it themselves.
    actionType: numeric && !unitHint ? "text_question" : draft.actionType,
    question: draft.question,
    options: draft.options,
    unitHint,
    estimatedMinutes: draft.estimatedMinutes,
    expectedImpact: draft.expectedImpact,
    topicKey: draft.topicKey,
  });
}

function fallbackAssistantMessage(action: DailyAction, language: SupportedLanguage): string {
  if (language === "my") {
    return `သင်ပြောပြထားတာတွေအပေါ် အခြေခံပြီး ဒီနေ့အတွက် အသုံးဝင်ဆုံး နောက်တစ်ဆင့်ကတော့ ${action.title} ပါ။ ${action.question}`;
  }
  return `Based on what you shared, one useful next step today is: ${action.question}`;
}

const LATIN_LETTER = /[A-Za-z\u00C0-\u024F]/;
// Myanmar, plus its Extended-A and Extended-B blocks.
const MYANMAR_LETTER = /[\u1000-\u109F\uA9E0-\uA9FF\uAA60-\uAA7F]/;

/**
 * Lowercase Latin words are the signature of the model copying English source
 * text straight into Burmese output ("single income, mortgage နှင့် ..."").
 * Uppercase acronyms and currency codes stay allowed, as do capitalised names,
 * numbers, and amounts, which the prompt asks us to keep verbatim.
 */
const LATIN_WORD_LEAK = /(?:^|[^A-Za-z])[a-z]{3,}(?:[^A-Za-z]|$)/;

/**
 * Allow-list rather than a list of known-bad scripts: Gemini has leaked CJK,
 * Thai and a single Gurmukhi glyph mid-word, and enumerating those after the
 * fact only ever catches the leaks we already saw.
 */
function hasForeignScript(text: string, language: SupportedLanguage): boolean {
  for (const character of text) {
    if (!/\p{L}/u.test(character)) continue;
    if (LATIN_LETTER.test(character)) continue;
    if (language === "my" && MYANMAR_LETTER.test(character)) continue;
    return true;
  }
  return false;
}

/**
 * Gemini leaks foreign glyphs and untranslated English into localized output.
 * Reject those drafts so we fall back rather than ship mixed-language copy.
 */
export function isCleanForLanguage(text: string, language: SupportedLanguage): boolean {
  if (hasForeignScript(text, language)) return false;
  if (language === "my" && LATIN_WORD_LEAK.test(text)) return false;
  return true;
}

function heuristicInterpretation(args: {
  language?: SupportedLanguage;
  question: string;
  answer: string | number | boolean;
  topicKey?: string;
}): AnswerInterpretation {
  const text = String(args.answer);
  const money = parseMoney(text, args.language ?? "en");

  const newCommitments =
    args.topicKey === "education_savings" && money
      ? [
          {
            type: "education_savings",
            amount: money.amount,
            currency: money.currency,
            description: "Education savings stated by the customer",
          },
        ]
      : args.topicKey === "emergency_fund_months"
        ? [
            {
              // A month count, not money: read the bare number and nothing else.
              type: "emergency_savings",
              amount: Number(myanmarDigitsToLatin(text).match(/(\d+(?:\.\d+)?)/)?.[1] ?? undefined),
              description: "Emergency savings in months of essential expenses",
            },
          ]
        : [];

  return {
    interpretedAnswer: args.answer,
    profileUpdates: {},
    newLifeEvents: [],
    newCommitments: newCommitments.filter((item) => item.amount !== undefined && !Number.isNaN(item.amount)),
    resolvedUnknowns: args.topicKey ? [humanUnknown(args.topicKey)] : [],
    newlyUnknown: [],
  };
}

function humanUnknown(topicKey: string): string {
  if (topicKey === "education_savings") return "education savings";
  if (topicKey === "emergency_fund_months") return "emergency savings";
  if (topicKey === "elder_care_shared") return "care sharing";
  return topicKey.replaceAll("_", " ");
}
