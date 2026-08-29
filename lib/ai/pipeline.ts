import { extractLifeContext } from "@/lib/ai/extraction";
import { generateDailyAction, interpretAnswer } from "@/lib/ai/reasoning";
import {
  applyExtraction,
  describeChanges,
  mergeCommitments,
  mergeLifeEvents,
  mergeProfile,
  mergeUnknowns,
} from "@/lib/engagement/context-merge";
import { calculateRisks } from "@/lib/risk/engine";
import type {
  CompletedAction,
  DailyAction,
  LifeContext,
  SupportedLanguage,
} from "@/lib/types/life-context";

export async function runAnalyze(input: string, language: SupportedLanguage, existing?: LifeContext | null) {
  const extracted = await extractLifeContext(input, language);
  const context = applyExtraction(existing, extracted.result, language);
  const generated = await generateDailyAction(context, language);
  return {
    context,
    dailyAction: generated.action,
    assistantMessage: generated.assistantMessage,
    source: extracted.source === "demo_backup" || generated.source === "demo_backup" ? "demo_backup" as const : "live_ai",
  };
}

export async function runCompleteAction(args: {
  language: SupportedLanguage;
  context: LifeContext;
  action: DailyAction;
  answer: string | number | boolean;
}) {
  const interpretation = await interpretAnswer({
    language: args.language,
    question: args.action.question,
    answer: args.answer,
    topicKey: args.action.topicKey,
  });

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
    commitments: mergeCommitments(args.context.commitments, interpretation.newCommitments),
    unknownImportantInformation: mergeUnknowns(
      args.context.unknownImportantInformation,
      interpretation.newlyUnknown,
      interpretation.resolvedUnknowns,
    ),
    completedActions: [...(args.context.completedActions ?? []), completed],
    lastUpdatedAt: new Date().toISOString(),
  };
  updatedContext.risks = calculateRisks(updatedContext, args.language);

  const generated = await generateDailyAction(updatedContext, args.language);
  return {
    updatedContext,
    nextAction: generated.action,
    assistantMessage: generated.assistantMessage,
    source: generated.source,
  };
}

export async function runLifeUpdate(
  input: string,
  language: SupportedLanguage,
  context: LifeContext,
) {
  const extracted = await extractLifeContext(input, language);
  const updatedContext = applyExtraction(context, extracted.result, language);
  const generated = await generateDailyAction(updatedContext, language);
  return {
    updatedContext,
    changesDetected: describeChanges(context, updatedContext),
    dailyAction: generated.action,
    assistantMessage: generated.assistantMessage,
    source: extracted.source === "demo_backup" || generated.source === "demo_backup" ? "demo_backup" as const : "live_ai",
  };
}
