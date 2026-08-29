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
import { categoryLabel } from "@/lib/risk/engine";
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
    const action = draftToAction(parsed.data);
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
      parsed.data.nextStep,
      ...parsed.data.priorities.map((item) => `${item.focus} ${item.why}`),
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

const LATIN_TO_MYANMAR_DIGITS = "၀၁၂၃၄၅၆၇၈၉";

function localizeNumber(value: number, language: SupportedLanguage): string {
  const text = String(value);
  if (language !== "my") return text;
  return text.replace(/\d/g, (digit) => LATIN_TO_MYANMAR_DIGITS[Number(digit)]);
}

/**
 * Built entirely from the deterministic risk engine, so the customer still
 * gets a real readout when the model is rate-limited or down. Uses the
 * contributing factors rather than the full risk explanation, because the
 * explanation carries a disclaimer suffix that would repeat on every line.
 */
function fallbackSummary(context: LifeContext, language: SupportedLanguage): LifeSummary {
  const top = [...context.risks]
    .filter((risk) => risk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const answered = localizeNumber(context.completedActions.length, language);
  const leadLabel = top.length ? categoryLabel(top[0].category, language) : null;

  const priorities = top.length
    ? top.map((risk) => ({
        focus: categoryLabel(risk.category, language),
        why: risk.contributingFactors.length
          ? risk.contributingFactors.join(" ")
          : risk.explanation,
      }))
    : [
        {
          focus: language === "my" ? "အချက်အလက် ဖြည့်စွက်ရန်" : "Filling in the picture",
          why:
            language === "my"
              ? "ဦးစားပေးအဆင့် သတ်မှတ်ရန် အချက်အလက် လုံလောက်စွာ မရသေးပါ။"
              : "There is not yet enough detail to rank one area above another.",
        },
      ];

  if (language === "my") {
    return {
      headline: leadLabel
        ? `သင့်အခြေအနေတွင် ${leadLabel} က အရေးအကြီးဆုံး ဖြစ်နေပါသည်`
        : "သင်ပြောပြထားချက်များအရ လက်ရှိအခြေအနေ",
      situation: `မေးခွန်း ${answered} ခုကို ဖြေပြီးပါပြီ။ ထိုအဖြေများအရ အောက်ပါနယ်ပယ်များကို အစဉ်လိုက် ဦးစားပေး ကြည့်သင့်ပါသည်။ ဤဂဏန်းများသည် ဘယ်အရာကို အရင်ကြည့်သင့်သည်ကို ပြသည့် အညွှန်းသာ ဖြစ်ပြီး မလုံခြုံမှု ရာခိုင်နှုန်း မဟုတ်ပါ။`,
      priorities,
      nextStep:
        "အထက်ပါ ဦးစားပေးအချက်များကို အရေးကြီးသော ငွေကြေးဆုံးဖြတ်ချက် မချမီ ကျွမ်းကျင်သူတစ်ဦးနှင့် တိုင်ပင်ဆွေးနွေးရန် စဉ်းစားနိုင်ပါသည်။",
    };
  }

  return {
    headline: leadLabel
      ? `${leadLabel} is what your answers point to first`
      : "Where you stand, based on what you shared",
    situation: `You answered ${answered} questions. Those answers rank the areas below in the order worth your attention. These numbers are a sequencing signal, not a measure of being unsafe.`,
    priorities,
    nextStep:
      "You may want to review these priorities with a qualified professional before making any major decision.",
  };
}

export async function interpretAnswer(args: {
  language: SupportedLanguage;
  question: string;
  answer: string | number | boolean;
  topicKey?: string;
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
    return parsed.data;
  } catch {
    return heuristicInterpretation(args);
  }
}

function draftToAction(draft: DailyActionDraft): DailyAction {
  return withActionId({
    focus: draft.focus,
    title: draft.title,
    reason: draft.reason,
    actionType: draft.actionType,
    question: draft.question,
    options: draft.options,
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
  question: string;
  answer: string | number | boolean;
  topicKey?: string;
}): AnswerInterpretation {
  const text = String(args.answer);
  const amountMatch = text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(million|million|သန်း)?/i);
  let amount: number | undefined;
  let currency: string | undefined;
  if (amountMatch) {
    amount = Number(amountMatch[1]);
    if (/million|သန်း/i.test(text)) amount *= 1_000_000;
    if (/¥|yen|jpy|ယန်း/i.test(text)) currency = "JPY";
  }

  const newCommitments =
    args.topicKey === "education_savings" && amount
      ? [
          {
            type: "education_savings",
            amount,
            currency,
            description: "Education savings stated by the customer",
          },
        ]
      : args.topicKey === "emergency_fund_months"
        ? [
            {
              type: "emergency_savings",
              amount: Number(text.match(/(\d+(?:\.\d+)?)/)?.[1] ?? undefined),
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
