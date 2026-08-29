import type { DailyAction, LifeContext, SupportedLanguage } from "@/lib/types/life-context";
import {
  completedTopicKeys,
  fallbackPressureQuestion,
  isRepeatedQuestion,
  withActionId,
} from "@/lib/engagement/repetition";
import { contextCurrency, withUnitHint } from "@/lib/engagement/units";

export function selectFallbackAction(
  context: LifeContext,
  language: SupportedLanguage,
): DailyAction {
  const thinContext =
    !context.profile.age &&
    (context.lifeEvents?.length ?? 0) === 0 &&
    (context.commitments?.length ?? 0) === 0;
  if (thinContext) {
    return fallbackPressureQuestion(language);
  }

  const blocked = new Set(completedTopicKeys(context).map((item) => item.toLowerCase()));
  const candidates = fallbackCatalog(context, language).filter(
    (action) => !blocked.has((action.topicKey ?? "").toLowerCase()) && !isRepeatedQuestion(action, context),
  );
  const currency = contextCurrency(context.commitments);
  return withUnitHint(candidates[0] ?? fallbackPressureQuestion(language), language, currency);
}

function fallbackCatalog(context: LifeContext, language: SupportedLanguage): DailyAction[] {
  const hasEducation = context.lifeEvents.some((event) =>
    /education|university|ပညာရေး|တက္ကသိုလ်/i.test(`${event.type} ${event.description}`),
  );
  const hasCare = context.lifeEvents.some((event) =>
    /aging|elder|care|father|mother|အဖေ|စောင့်ရှောက်/i.test(`${event.type} ${event.description}`),
  );
  const hasMortgage = context.commitments.some((item) =>
    /mortgage|အိမ်ချေး/i.test(`${item.type} ${item.description}`),
  );

  const en: DailyAction[] = [
    ...(hasEducation
      ? [
          withActionId({
            focus: "Education Planning",
            title: "Check education savings",
            reason:
              "Your oldest child starts university within a short time horizon, making education preparation one of the most time-sensitive responsibilities.",
            actionType: "numeric_input",
            question: "How much have you already saved for education?",
            estimatedMinutes: 1,
            expectedImpact: "Shows whether education planning needs attention this week.",
            topicKey: "education_savings",
          }),
        ]
      : []),
    withActionId({
      focus: "Financial Resilience",
      title: "Check your emergency buffer",
      reason:
        "Several household responsibilities currently depend on known financial commitments, so a small resilience check is the most useful next step.",
      actionType: "numeric_input",
      question: "Approximately how many months of essential expenses could your current savings cover?",
      estimatedMinutes: 1,
      expectedImpact: "Helps sequence the next useful action without repeating known facts.",
      topicKey: "emergency_fund_months",
    }),
    ...(hasCare
      ? [
          withActionId({
            focus: "Family Care",
            title: "Clarify care support",
            reason:
              "An aging parent may need care soon, so understanding whether that responsibility is shared is a small, high-value step.",
            actionType: "confirmation",
            question: "Is responsibility for your father's care shared with another family member?",
            estimatedMinutes: 1,
            expectedImpact: "Clarifies whether care planning should stay in today's focus.",
            topicKey: "elder_care_shared",
          }),
        ]
      : []),
    ...(hasMortgage
      ? [
          withActionId({
            focus: "Housing",
            title: "Name the expense that worries you most",
            reason:
              "A large housing commitment is already known, so the next useful step is identifying which upcoming expense feels most urgent.",
            actionType: "text_question",
            question: "Which upcoming expense concerns you most right now?",
            estimatedMinutes: 1,
            expectedImpact: "Keeps tomorrow's action specific instead of generic.",
            topicKey: "top_upcoming_expense",
          }),
        ]
      : []),
    fallbackPressureQuestion("en"),
  ];

  const my: DailyAction[] = [
    ...(hasEducation
      ? [
          withActionId({
            focus: "Education Planning",
            title: "ပညာရေးစုငွေကို ကြည့်ရန်",
            reason:
              "သင့်ရဲ့အကြီးဆုံးကလေးက နောက် ၂ နှစ်အတွင်း တက္ကသိုလ်တက်တော့မှာဖြစ်တဲ့အတွက် ပညာရေးကုန်ကျစရိတ်အတွက် ပြင်ဆင်ဖို့ အချိန်က အရေးကြီးလာပါတယ်။",
            actionType: "numeric_input",
            question: "ပညာရေးအတွက် ဘယ်လောက်အထိ စုထားပြီးပြီလဲ။",
            estimatedMinutes: 1,
            expectedImpact: "ပညာရေးပြင်ဆင်မှုကို ဒီအပတ်မှာ ဦးစားပေးသင့်မသင့် ပိုရှင်းလာစေပါတယ်။",
            topicKey: "education_savings",
          }),
        ]
      : []),
    withActionId({
      focus: "Financial Resilience",
      title: "အရေးပေါ်စုငွေကို စစ်ကြည့်ရန်",
      reason:
        "အိမ်ထောင်စုတာဝန်အများအပြားက သိရှိပြီးသား ငွေကြေးကတိကဝတ်တွေအပေါ် မူတည်နေလို့ အရေးပေါ်ခံနိုင်ရည်ကို အရင်ကြည့်သင့်ပါတယ်။",
      actionType: "numeric_input",
      question: "အခုရှိတဲ့ စုငွေက မရှိမဖြစ်ကုန်ကျစရိတ် ဘယ်နှစ်လစာလောက် ဖုံးနိုင်မလဲ။",
      estimatedMinutes: 1,
      expectedImpact: "နောက်နေ့အတွက် ပိုတိကျတဲ့ လုပ်ဆောင်ချက်ကို ရွေးချယ်နိုင်စေပါတယ်။",
      topicKey: "emergency_fund_months",
    }),
    ...(hasCare
      ? [
          withActionId({
            focus: "Family Care",
            title: "စောင့်ရှောက်မှုတာဝန်ကို ရှင်းရန်",
            reason:
              "အဖေက မကြာခင် စောင့်ရှောက်မှုလိုလာနိုင်တဲ့အတွက် တာဝန်ကို မျှဝေထားသလား ဆိုတာက အရေးကြီးပါတယ်။",
            actionType: "confirmation",
            question: "အဖေ့စောင့်ရှောက်မှုတာဝန်ကို မိသားစုဝင်တစ်ဦးနှင့် မျှဝေထားပါသလား။",
            estimatedMinutes: 1,
            expectedImpact: "စောင့်ရှောက်မှုကို ဒီနေ့ ဦးစားပေးသင့်မသင့် ပိုရှင်းစေပါတယ်။",
            topicKey: "elder_care_shared",
          }),
        ]
      : []),
    fallbackPressureQuestion("my"),
  ];

  return language === "my" ? my : en;
}
