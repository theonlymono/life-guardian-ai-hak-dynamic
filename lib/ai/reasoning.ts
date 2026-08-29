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
  isRepeatedQuestion,
  withActionId,
} from "@/lib/engagement/repetition";
import { demoAnswerInterpretation, demoDailyAction } from "@/lib/demo/backup";
import type {
  DailyAction,
  LifeContext,
  SupportedLanguage,
} from "@/lib/types/life-context";

export async function generateDailyAction(
  context: LifeContext,
  language: SupportedLanguage,
): Promise<{ action: DailyAction; assistantMessage: string; source: "live_ai" | "demo_backup" }> {
  const fallback = selectFallbackAction(context, language);
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
    if (isRepeatedQuestion(action, context)) {
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
    return `သင်ပြောပြထားတာတွေအပေါ် အခြေခံပြီး ဒီနေ့အတွက် အသုံးဝင်ဆုံး နောက်တစ်ဆင့်က ${action.title} ပါ။ ${action.question}`;
  }
  return `Based on what you shared, one useful next step today is: ${action.question}`;
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
