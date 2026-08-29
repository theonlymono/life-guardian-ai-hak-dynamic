import type { DailyAction, LifeContext, SupportedLanguage } from "@/lib/types/life-context";
import { createEntityId } from "@/lib/types/life-context";

export function normalizeQuestion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRepeatedQuestion(
  candidate: Pick<DailyAction, "question" | "topicKey" | "focus">,
  context: Pick<LifeContext, "completedActions">,
): boolean {
  const completed = context.completedActions ?? [];
  if (candidate.topicKey) {
    const topic = candidate.topicKey.toLowerCase();
    if (completed.some((item) => item.topicKey?.toLowerCase() === topic)) {
      return true;
    }
  }

  const nextQuestion = normalizeQuestion(candidate.question);
  return completed.some((item) => {
    const previous = normalizeQuestion(item.question);
    if (!previous || !nextQuestion) return false;
    if (previous === nextQuestion) return true;
    return sharesSignificantOverlap(previous, nextQuestion);
  });
}

export function completedTopicKeys(context: Pick<LifeContext, "completedActions">): string[] {
  return (context.completedActions ?? [])
    .map((item) => item.topicKey)
    .filter((value): value is string => Boolean(value));
}

export function withActionId(
  draft: Omit<DailyAction, "id"> & { id?: string },
): DailyAction {
  return {
    ...draft,
    id: draft.id && draft.id.length > 0 ? draft.id : createEntityId("action"),
    estimatedMinutes: Math.min(3, Math.max(1, Math.round(draft.estimatedMinutes || 2))),
  };
}

export function fallbackPressureQuestion(language: SupportedLanguage): DailyAction {
  if (language === "my") {
    return withActionId({
      focus: "Life Pressure",
      title: "အခု ဘာက အများဆုံး ဖိအားပေးနေလဲ",
      reason:
        "အသေးစိတ်အချက်အလက် မလုံလောက်သေးလို့ တစ်ခုတည်းသော အရေးကြီးမေးခွန်းနဲ့ စတင်ပါမယ်။",
      actionType: "multiple_choice",
      question:
        "အခု သင့်ကို အများဆုံး ဖိအားပေးနေတာက ဘာလဲ — နေ့စဉ်ကုန်ကျစရိတ်၊ ကြွေးမြီ၊ မိသားစုတာဝန်၊ သို့မဟုတ် နီးကပ်လာတဲ့ ဘဝအပြောင်းအလဲ?",
      options: ["နေ့စဉ်ကုန်ကျစရိတ်", "ကြွေးမြီ", "မိသားစုတာဝန်", "နီးကပ်လာတဲ့ ဘဝအပြောင်းအလဲ"],
      estimatedMinutes: 1,
      expectedImpact: "ဘယ်အရာကို အရင်နားလည်သင့်သလဲ ဆိုတာ ပိုရှင်းလာစေပါတယ်။",
      topicKey: "current_pressure",
    });
  }

  return withActionId({
    focus: "Life Pressure",
    title: "Name the pressure that matters most",
    reason:
      "There is not enough specific context yet, so one high-value question is the most useful next step.",
    actionType: "multiple_choice",
    question:
      "What is creating the most pressure right now: daily expenses, debt, family responsibilities, or an upcoming life event?",
    options: [
      "Daily expenses",
      "Debt",
      "Family responsibilities",
      "An upcoming life event",
    ],
    estimatedMinutes: 1,
    expectedImpact: "This identifies where Life Guardian should focus tomorrow.",
    topicKey: "current_pressure",
  });
}

function sharesSignificantOverlap(a: string, b: string): boolean {
  const aTokens = new Set(a.split(" ").filter((token) => token.length > 3));
  const bTokens = b.split(" ").filter((token) => token.length > 3);
  if (aTokens.size === 0 || bTokens.length === 0) return false;
  const overlap = bTokens.filter((token) => aTokens.has(token)).length;
  return overlap >= 5;
}
