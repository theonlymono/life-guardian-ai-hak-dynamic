import type {
  FinancialCommitment,
  LifeContext,
  LifeEvent,
  UserProfile,
} from "@/lib/types/life-context";
import { createEntityId, emptyLifeContext } from "@/lib/types/life-context";
import type { ExtractionResult } from "@/lib/ai/schemas";
import { calculateRisks } from "@/lib/risk/engine";
import type { SupportedLanguage } from "@/lib/types/life-context";

export function mergeProfile(
  current: UserProfile | undefined,
  incoming: UserProfile | undefined,
): UserProfile {
  return {
    ...current,
    ...omitUndefined(incoming ?? {}),
  };
}

export function mergeLifeEvents(
  current: LifeEvent[] = [],
  incoming: Array<Omit<LifeEvent, "id"> & { id?: string }>,
): LifeEvent[] {
  const merged = [...current];
  for (const event of incoming) {
    const duplicate = merged.find(
      (item) =>
        normalize(item.type) === normalize(event.type) &&
        normalize(item.description) === normalize(event.description),
    );
    if (duplicate) {
      duplicate.timeHorizon = event.timeHorizon ?? duplicate.timeHorizon;
      duplicate.evidence = event.evidence || duplicate.evidence;
      continue;
    }
    merged.push({
      id: event.id || createEntityId("event"),
      type: event.type,
      description: event.description,
      timeHorizon: event.timeHorizon,
      evidence: event.evidence,
    });
  }
  return merged;
}

export function mergeCommitments(
  current: FinancialCommitment[] = [],
  incoming: Array<Omit<FinancialCommitment, "id"> & { id?: string }>,
): FinancialCommitment[] {
  const merged = [...current];
  for (const item of incoming) {
    const duplicate = merged.find(
      (existing) =>
        normalize(existing.type) === normalize(item.type) &&
        (item.amount === undefined || existing.amount === item.amount),
    );
    if (duplicate) {
      duplicate.amount = item.amount ?? duplicate.amount;
      duplicate.currency = item.currency ?? duplicate.currency;
      duplicate.description = item.description || duplicate.description;
      continue;
    }
    merged.push({
      id: item.id || createEntityId("commitment"),
      type: item.type,
      amount: item.amount,
      currency: item.currency,
      description: item.description,
    });
  }
  return merged;
}

export function mergeUnknowns(
  current: string[] = [],
  incoming: string[] = [],
  resolved: string[] = [],
): string[] {
  const resolvedSet = new Set(resolved.map(normalize));
  const next = [...current, ...incoming]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !resolvedSet.has(normalize(item)));
  return Array.from(new Set(next));
}

export function applyExtraction(
  existing: LifeContext | null | undefined,
  extraction: ExtractionResult,
  language: SupportedLanguage,
): LifeContext {
  const base = existing ?? emptyLifeContext();
  const next: LifeContext = {
    ...base,
    profile: mergeProfile(base.profile, extraction.profile),
    lifeEvents: mergeLifeEvents(base.lifeEvents, extraction.lifeEvents),
    commitments: mergeCommitments(base.commitments, extraction.commitments),
    completedActions: base.completedActions ?? [],
    unknownImportantInformation: mergeUnknowns(
      base.unknownImportantInformation,
      extraction.unknownImportantInformation,
    ),
    lastUpdatedAt: new Date().toISOString(),
  };
  next.risks = calculateRisks(next, language);
  return next;
}

export function describeChanges(before: LifeContext, after: LifeContext): string[] {
  const changes: string[] = [];
  if (before.profile.age !== after.profile.age && after.profile.age !== undefined) {
    changes.push(`age:${after.profile.age}`);
  }
  if (
    before.profile.dependents !== after.profile.dependents &&
    after.profile.dependents !== undefined
  ) {
    changes.push(`dependents:${after.profile.dependents}`);
  }
  if (
    before.profile.incomeStructure !== after.profile.incomeStructure &&
    after.profile.incomeStructure
  ) {
    changes.push(`incomeStructure:${after.profile.incomeStructure}`);
  }
  for (const event of after.lifeEvents) {
    if (!before.lifeEvents.some((item) => item.id === event.id)) {
      changes.push(`lifeEvent:${event.type}`);
    }
  }
  for (const item of after.commitments) {
    if (!before.commitments.some((existing) => existing.id === item.id)) {
      changes.push(`commitment:${item.type}`);
    }
  }
  return changes;
}

function omitUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => value !== undefined && item !== undefined),
  ) as T;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
