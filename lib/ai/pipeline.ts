import { extractLifeContext } from "@/lib/ai/extraction";
import {
  generateDailyAction,
  generateSummary,
  interpretAnswer,
  numericInterpretation,
  summaryLeadIn,
} from "@/lib/ai/reasoning";
import {
  applyExtraction,
  describeChanges,
  mergeCommitments,
  mergeLifeEvents,
  mergeProfile,
  mergeUnknowns,
  rejectUnrelatedCommitmentEdits,
} from "@/lib/engagement/context-merge";
import {
  MAX_ENGAGEMENT_QUESTIONS,
  hasReachedQuestionLimit,
  questionsAnswered,
} from "@/lib/engagement/limits";
import { calculateRisks } from "@/lib/risk/engine";
import { isRepeatedQuestion } from "@/lib/engagement/repetition";
import type { GoalSimulation } from "@/lib/simulation/goal";
import { goalInputQuestion } from "@/lib/simulation/questions";
import { resolveGoalProgress } from "@/lib/simulation/resolve";
import type {
  CompletedAction,
  DailyAction,
  LifeContext,
  LifeSummary,
  SupportedLanguage,
} from "@/lib/types/life-context";

type Source = "live_ai" | "demo_backup";

interface Outcome {
  action: DailyAction | null;
  summary: LifeSummary | null;
  simulation: GoalSimulation | null;
  assistantMessage: string;
  questionsAnswered: number;
  questionsTotal: number;
  source: Source;
}

/**
 * Decides whether the customer gets another question or the closing readout.
 *
 * Past MAX_ENGAGEMENT_QUESTIONS we stop asking entirely: an assistant that
 * always answers with one more question never feels like it arrives anywhere.
 */
async function nextStep(
  context: LifeContext,
  language: SupportedLanguage,
): Promise<Outcome> {
  const answered = questionsAnswered(context);
  const goal = resolveGoalProgress(context);
  const simulation = goal?.simulation ?? null;

  if (hasReachedQuestionLimit(context)) {
    const generated = await generateSummary(context, language);
    return {
      action: null,
      summary: generated.summary,
      simulation,
      assistantMessage: summaryLeadIn(language),
      questionsAnswered: answered,
      questionsTotal: MAX_ENGAGEMENT_QUESTIONS,
      source: generated.source,
    };
  }

  // A goal one answer short of a real projection beats anything the model
  // would invent to ask: the customer gets a number back for their trouble.
  if (goal && goal.missing.length > 0) {
    const question = goalInputQuestion({
      goalKey: goal.goalKey,
      kind: goal.missing[0],
      currency: goal.currency,
      language,
    });
    if (!isRepeatedQuestion(question, context)) {
      return {
        action: question,
        summary: null,
        simulation,
        assistantMessage: question.reason,
        questionsAnswered: answered,
        questionsTotal: MAX_ENGAGEMENT_QUESTIONS,
        source: "live_ai",
      };
    }
  }

  const generated = await generateDailyAction(context, language);
  return {
    action: generated.action,
    summary: null,
    simulation,
    assistantMessage: generated.assistantMessage,
    questionsAnswered: answered,
    questionsTotal: MAX_ENGAGEMENT_QUESTIONS,
    source: generated.source,
  };
}

function worstSource(a: Source, b: Source): Source {
  return a === "demo_backup" || b === "demo_backup" ? "demo_backup" : "live_ai";
}

export async function runAnalyze(
  input: string,
  language: SupportedLanguage,
  existing?: LifeContext | null,
) {
  const extracted = await extractLifeContext(input, language);
  const context = applyExtraction(existing, extracted.result, language);
  const step = await nextStep(context, language);
  return {
    context,
    dailyAction: step.action,
    summary: step.summary,
    simulation: step.simulation,
    assistantMessage: step.assistantMessage,
    questionsAnswered: step.questionsAnswered,
    questionsTotal: step.questionsTotal,
    source: worstSource(extracted.source, step.source),
  };
}

export async function runCompleteAction(args: {
  language: SupportedLanguage;
  context: LifeContext;
  action: DailyAction;
  answer: string | number | boolean;
}) {
  const interpretation =
    numericInterpretation({
      answer: args.answer,
      topicKey: args.action.topicKey,
      unitHint: args.action.unitHint,
      currency: args.context.commitments.find((item) => item.currency)?.currency,
    }) ??
    (await interpretAnswer({
      language: args.language,
      question: args.action.question,
      answer: args.answer,
      topicKey: args.action.topicKey,
      unitHint: args.action.unitHint,
    }));

  const completed: CompletedAction = {
    actionId: args.action.id,
    focus: args.action.focus,
    question: args.action.question,
    answer: interpretation.interpretedAnswer,
    completedAt: new Date().toISOString(),
    topicKey: args.action.topicKey,
  };

  const updatedContext: LifeContext = {
    ...args.context,
    profile: mergeProfile(args.context.profile, interpretation.profileUpdates),
    lifeEvents: mergeLifeEvents(args.context.lifeEvents, interpretation.newLifeEvents),
    commitments: mergeCommitments(
      args.context.commitments,
      rejectUnrelatedCommitmentEdits(
        args.context.commitments,
        interpretation.newCommitments,
        args.action.topicKey,
      ),
    ),
    unknownImportantInformation: mergeUnknowns(
      args.context.unknownImportantInformation,
      interpretation.newlyUnknown,
      interpretation.resolvedUnknowns,
    ),
    completedActions: [...(args.context.completedActions ?? []), completed],
    lastUpdatedAt: new Date().toISOString(),
  };
  updatedContext.risks = calculateRisks(updatedContext, args.language);

  const step = await nextStep(updatedContext, args.language);
  return {
    updatedContext,
    nextAction: step.action,
    summary: step.summary,
    simulation: step.simulation,
    assistantMessage: step.assistantMessage,
    questionsAnswered: step.questionsAnswered,
    questionsTotal: step.questionsTotal,
    source: step.source,
  };
}

export async function runLifeUpdate(
  input: string,
  language: SupportedLanguage,
  context: LifeContext,
) {
  const extracted = await extractLifeContext(input, language);
  const updatedContext = applyExtraction(context, extracted.result, language);
  const step = await nextStep(updatedContext, language);
  return {
    updatedContext,
    changesDetected: describeChanges(context, updatedContext),
    dailyAction: step.action,
    summary: step.summary,
    simulation: step.simulation,
    assistantMessage: step.assistantMessage,
    questionsAnswered: step.questionsAnswered,
    questionsTotal: step.questionsTotal,
    source: worstSource(extracted.source, step.source),
  };
}
