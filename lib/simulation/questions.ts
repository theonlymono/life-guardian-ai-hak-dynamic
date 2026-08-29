import type { DailyAction, SupportedLanguage } from "@/lib/types/life-context";
import { withActionId } from "@/lib/engagement/repetition";
import { moneyUnit } from "@/lib/i18n/money";
import { GOAL_TOPICS, type GoalInputKind } from "./resolve";
import type { GoalKey } from "./goal";

/**
 * The three questions a projection needs, written out rather than left to the
 * model. Each one is the reason the next screen can show a real number, so the
 * wording, the unit and the topic key all have to be predictable.
 */
type Copy = { focus: string; title: string; reason: string; question: string; impact: string };

const COPY: Record<GoalKey, Record<GoalInputKind, Record<SupportedLanguage, Copy>>> = {
  education_fund: {
    current: {
      en: {
        focus: "Education Planning",
        title: "Education savings so far",
        reason:
          "University is close enough that the gap is worth seeing, and the starting point is what you have already put aside.",
        question: "How much have you already saved for your child's education?",
        impact: "First of three figures needed to project the education gap.",
      },
      my: {
        focus: "Education Planning",
        title: "ပညာရေးအတွက် စုပြီးသားငွေ",
        reason:
          "တက္ကသိုလ်တက်ရမယ့်အချိန် နီးလာပြီမို့ လိုအပ်ချက်ကို တွက်ကြည့်သင့်ပါပြီ။ စတင်မှတ်ရမယ့်အချက်က လက်ရှိစုပြီးသားပမာဏပါ။",
        question: "ကလေးရဲ့ ပညာရေးအတွက် အခုအထိ ဘယ်လောက် စုထားပြီးပြီလဲ။",
        impact: "ပညာရေးလိုငွေ တွက်ဖို့ လိုအပ်တဲ့ ဂဏန်းသုံးခုထဲက ပထမတစ်ခုပါ။",
      },
    },
    target: {
      en: {
        focus: "Education Planning",
        title: "What the course will need",
        reason:
          "You know the schools you are considering; we do not. Your own estimate keeps the projection tied to reality.",
        question: "Roughly how much do you expect the whole course to cost?",
        impact: "Sets the target the projection measures against.",
      },
      my: {
        focus: "Education Planning",
        title: "စုစုပေါင်း လိုအပ်မယ့်ပမာဏ",
        reason:
          "စဉ်းစားထားတဲ့ ကျောင်းတွေကို သင်သိပါတယ်၊ ကျွန်ုပ်တို့ မသိပါ။ သင့်ခန့်မှန်းချက်ကသာ တွက်ချက်မှုကို အမှန်တကယ်နဲ့ ကိုက်ညီစေပါမယ်။",
        question: "ကျောင်းပြီးဆုံးတဲ့အထိ စုစုပေါင်း ဘယ်လောက်ကုန်မယ်လို့ ခန့်မှန်းထားလဲ။",
        impact: "တွက်ချက်မှုက ဘယ်ပမာဏကို ရည်မှန်းရမလဲဆိုတာ သတ်မှတ်ပေးပါတယ်။",
      },
    },
    monthly: {
      en: {
        focus: "Education Planning",
        title: "What you can set aside",
        reason:
          "With a starting point and a target, the only missing piece is the pace you can realistically keep.",
        question: "How much could you set aside each month for this?",
        impact: "Completes the projection and shows the gap at your own pace.",
      },
      my: {
        focus: "Education Planning",
        title: "တစ်လကို ဖယ်ထားနိုင်တဲ့ပမာဏ",
        reason:
          "စတင်ပမာဏနဲ့ ရည်မှန်းချက် ရပြီမို့ ကျန်တာက သင်တကယ် ဆက်လုပ်နိုင်မယ့် နှုန်းပဲ ဖြစ်ပါတယ်။",
        question: "ဒီအတွက် တစ်လကို ဘယ်လောက်လောက် ဖယ်ထားနိုင်မလဲ။",
        impact: "တွက်ချက်မှု ပြည့်စုံပြီး သင့်နှုန်းအတိုင်း ဘယ်လောက်လိုသေးလဲ ပြပေးပါမယ်။",
      },
    },
    horizon: {
      en: {
        focus: "Education Planning",
        title: "When it starts",
        reason: "A gap only means something against a date.",
        question: "In how many years does the course start?",
        impact: "Sets the time the plan has to work with.",
      },
      my: {
        focus: "Education Planning",
        title: "ဘယ်အချိန်စမလဲ",
        reason: "ရက်စွဲမရှိရင် လိုငွေဆိုတာ အဓိပ္ပာယ်မရှိပါဘူး။",
        question: "နောက် ဘယ်နှစ်နှစ်အကြာမှာ ကျောင်းစတက်ရမလဲ။",
        impact: "အစီအစဉ်အတွက် ရရှိမယ့်အချိန်ကို သတ်မှတ်ပေးပါတယ်။",
      },
    },
  },
  retirement_fund: {
    current: {
      en: {
        focus: "Retirement",
        title: "Retirement savings so far",
        reason: "The projection starts from what you have already set aside.",
        question: "How much have you saved towards retirement so far?",
        impact: "First of three figures needed to project the retirement gap.",
      },
      my: {
        focus: "Retirement",
        title: "အငြိမ်းစားအတွက် စုပြီးသားငွေ",
        reason: "တွက်ချက်မှုက လက်ရှိ ဖယ်ထားပြီးသားပမာဏကနေ စတင်ပါတယ်။",
        question: "အငြိမ်းစားအတွက် အခုအထိ ဘယ်လောက် စုထားပြီးပြီလဲ။",
        impact: "အငြိမ်းစားလိုငွေ တွက်ဖို့ လိုအပ်တဲ့ ဂဏန်းသုံးခုထဲက ပထမတစ်ခုပါ။",
      },
    },
    target: {
      en: {
        focus: "Retirement",
        title: "What you want to have by then",
        reason:
          "Only you know the life you are planning for, so the target has to be your figure rather than ours.",
        question: "How much would you like to have by the time you retire?",
        impact: "Sets the target the projection measures against.",
      },
      my: {
        focus: "Retirement",
        title: "အဲ့ဒီအချိန်မှာ ရှိစေချင်တဲ့ပမာဏ",
        reason:
          "ဘယ်လိုဘဝမျိုးအတွက် ပြင်ဆင်နေလဲဆိုတာ သင်ကပဲ သိပါတယ်။ ဒါကြောင့် ရည်မှန်းပမာဏက ကျွန်ုပ်တို့ဟာမဟုတ်ဘဲ သင့်ဂဏန်း ဖြစ်ရပါမယ်။",
        question: "အငြိမ်းစားယူချိန်မှာ ဘယ်လောက် ရှိစေချင်ပါသလဲ။",
        impact: "တွက်ချက်မှုက ဘယ်ပမာဏကို ရည်မှန်းရမလဲဆိုတာ သတ်မှတ်ပေးပါတယ်။",
      },
    },
    monthly: {
      en: {
        focus: "Retirement",
        title: "What you can set aside",
        reason: "The pace you can keep decides whether the target is reachable in the years left.",
        question: "How much could you set aside each month for this?",
        impact: "Completes the projection and shows the gap at your own pace.",
      },
      my: {
        focus: "Retirement",
        title: "တစ်လကို ဖယ်ထားနိုင်တဲ့ပမာဏ",
        reason:
          "သင်ဆက်လုပ်နိုင်မယ့်နှုန်းက ကျန်တဲ့နှစ်တွေအတွင်း ရည်မှန်းချက်ကို ရောက်နိုင်မလားဆိုတာ ဆုံးဖြတ်ပါတယ်။",
        question: "ဒီအတွက် တစ်လကို ဘယ်လောက်လောက် ဖယ်ထားနိုင်မလဲ။",
        impact: "တွက်ချက်မှု ပြည့်စုံပြီး သင့်နှုန်းအတိုင်း ဘယ်လောက်လိုသေးလဲ ပြပေးပါမယ်။",
      },
    },
    horizon: {
      en: {
        focus: "Retirement",
        title: "When you plan to retire",
        reason: "The years left decide what any monthly amount can reach.",
        question: "At what age do you plan to retire?",
        impact: "Sets the time the plan has to work with.",
      },
      my: {
        focus: "Retirement",
        title: "ဘယ်အချိန် အငြိမ်းစားယူမလဲ",
        reason: "ကျန်တဲ့နှစ်အရေအတွက်က တစ်လစုငွေဘယ်လောက်နဲ့ ဘာရနိုင်လဲဆိုတာ ဆုံးဖြတ်ပါတယ်။",
        question: "အသက်ဘယ်လောက်မှာ အငြိမ်းစားယူဖို့ စဉ်းစားထားလဲ။",
        impact: "အစီအစဉ်အတွက် ရရှိမယ့်အချိန်ကို သတ်မှတ်ပေးပါတယ်။",
      },
    },
  },
};

export function goalInputQuestion(args: {
  goalKey: GoalKey;
  kind: GoalInputKind;
  currency: string;
  language: SupportedLanguage;
}): DailyAction {
  const copy = COPY[args.goalKey][args.kind][args.language];
  const topicKey =
    args.kind === "horizon"
      ? args.goalKey === "education_fund"
        ? "education_horizon"
        : "retirement_age"
      : GOAL_TOPICS[args.goalKey][args.kind];

  return withActionId({
    focus: copy.focus,
    title: copy.title,
    reason: copy.reason,
    actionType: "numeric_input",
    question: copy.question,
    unitHint:
      args.kind === "horizon"
        ? args.goalKey === "education_fund"
          ? args.language === "my"
            ? "နှစ်"
            : "years"
          : args.language === "my"
            ? "နှစ်"
            : "years old"
        : moneyUnit(args.currency, args.language),
    estimatedMinutes: 1,
    expectedImpact: copy.impact,
    topicKey,
  });
}
