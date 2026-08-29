import {
  answerInterpretationSchema,
  dailyActionDraftSchema,
  type AnswerInterpretation,
  type DailyActionDraft,
} from "@/lib/ai/schemas";
import { completeJson, isAiConfigured, isDemoBackupMode } from "@/lib/ai/client";
import {
  ACTION_SYSTEM,
  INTERPRET_SYSTEM,
  actionUserPrompt,
  interpretUserPrompt,
} from "@/lib/ai/prompts";
import { selectFallbackAction } from "@/lib/engagement/daily-action";
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

const NON_BURMESE_SCRIPT = /[\u4E00-\u9FFF\u3040-\u30FF\u0E00-\u0E7F]/;

/** Gemini occasionally leaks CJK/Thai glyphs into Burmese output. Reject those drafts. */
export function isCleanForLanguage(text: string, language: SupportedLanguage): boolean {
  if (language !== "my") return true;
  return !NON_BURMESE_SCRIPT.test(text);
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
