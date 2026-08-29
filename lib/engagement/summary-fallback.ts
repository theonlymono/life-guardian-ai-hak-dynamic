import { categoryLabel } from "@/lib/risk/engine";
import type {
  LifeContext,
  LifePlanStep,
  LifeSummary,
  RiskCategory,
  RiskScore,
  SupportedLanguage,
} from "@/lib/types/life-context";

/**
 * One concrete step per risk category, for when the model is unavailable.
 *
 * Each is something the customer can finish alone in a sitting, and each
 * produces a fact they did not have before rather than asking them to commit
 * money. That keeps the offline plan useful without straying into advice we
 * are not qualified to give.
 */
const CATEGORY_STEPS: Record<
  RiskCategory,
  Record<SupportedLanguage, { title: string; detail: string }>
> = {
  finance: {
    en: {
      title: "Write down one month of essential expenses",
      detail:
        "Add up housing, food, utilities, transport and loan repayments for a single month. That one number is what every savings target you set later gets measured against.",
    },
    my: {
      title: "တစ်လစာ မဖြစ်မနေ ကုန်ကျစရိတ်ကို ချရေးပါ",
      detail:
        "အိမ်ခ၊ စားစရိတ်၊ မီးဖိုချောင်သုံးစရိတ်၊ သွားလာစရိတ်နှင့် ချေးငွေပြန်ဆပ်ငွေတို့ကို တစ်လစာ ပေါင်းကြည့်ပါ။ ဤဂဏန်းတစ်ခုသည် နောက်ပိုင်း စုဆောင်းရမည့် ပမာဏအားလုံးကို တိုင်းတာမည့် စံ ဖြစ်ပါသည်။",
    },
  },
  education: {
    en: {
      title: "Ask the schools for their total first-year cost",
      detail:
        "Request tuition, entrance fees and living costs in writing from the universities your child is considering. Set that total beside what you have put aside so far and note the difference.",
    },
    my: {
      title: "တက္ကသိုလ်များ၏ ပထမနှစ် စုစုပေါင်းကုန်ကျစရိတ်ကို စုံစမ်းပါ",
      detail:
        "သားသမီး စဉ်းစားထားသည့် တက္ကသိုလ်များထံမှ ကျောင်းလခ၊ ဝင်ခွင့်ကြေးနှင့် နေထိုင်စရိတ်တို့ကို စာဖြင့် တောင်းယူပါ။ ထိုစုစုပေါင်းကို ယခုအထိ စုထားနိုင်သည့် ပမာဏနှင့် ယှဉ်ထားပြီး ကွာဟချက်ကို မှတ်ထားပါ။",
    },
  },
  healthCare: {
    en: {
      title: "Agree with your family who does what",
      detail:
        "Have one conversation with your siblings or relatives about who would handle day-to-day care, who would handle the money, and who gets called first in an emergency. Write down what you agree so nobody has to decide it under pressure.",
    },
    my: {
      title: "စောင့်ရှောက်မှုတာဝန်ကို မိသားစုအတွင်း သဘောတူညီထားပါ",
      detail:
        "နေ့စဉ်ပြုစုစောင့်ရှောက်မှုကို မည်သူတာဝန်ယူမည်၊ ငွေကြေးကို မည်သူကိုင်တွယ်မည်၊ အရေးပေါ်အခြေအနေတွင် မည်သူ့ကို ဦးစွာဆက်သွယ်မည် ဆိုသည်ကို ညီအစ်ကိုမောင်နှမများနှင့် တစ်ကြိမ် ဆွေးနွေးပါ။ သဘောတူညီချက်ကို ချရေးထားပါက အရေးပေါ်အချိန်တွင် ဆုံးဖြတ်ရန် မလိုတော့ပါ။",
    },
  },
  housing: {
    en: {
      title: "Pull out your mortgage paperwork and check two things",
      detail:
        "Find the remaining balance and the final payment date, then check whether the loan already carries life cover that would clear it. Many household mortgages do, and knowing either way changes what else you need.",
    },
    my: {
      title: "အိမ်ချေးငွေ စာရွက်စာတမ်းကို ထုတ်၍ နှစ်ချက် စစ်ဆေးပါ",
      detail:
        "ကျန်ရှိနေသည့် ငွေပမာဏနှင့် နောက်ဆုံးပေးဆပ်ရမည့်ရက်ကို ရှာပါ။ ထို့နောက် ချေးငွေတွင် အသက်အာမခံ ပါပြီးသားဟုတ်မဟုတ် စစ်ပါ။ ပါသည်ဖြစ်စေ မပါသည်ဖြစ်စေ သိထားရုံဖြင့် နောက်ထပ် မည်သည့်အရာ လိုအပ်သေးသည်ကို ဆုံးဖြတ်နိုင်ပါသည်။",
    },
  },
  family: {
    en: {
      title: "Check what your family would live on for six months without your income",
      detail:
        "List every source that would still pay out — savings, a spouse's earnings, any cover you already hold — and work out how far it stretches. Note the gap; you do not have to solve it today.",
    },
    my: {
      title: "သင့်ဝင်ငွေ မရှိတော့ပါက မိသားစု ခြောက်လ မည်သို့ ရပ်တည်မည်ကို စစ်ပါ",
      detail:
        "စုငွေ၊ အိမ်ထောင်ဖက်၏ ဝင်ငွေ၊ ရှိပြီးသား အာမခံ စသည်ဖြင့် ဆက်လက်ရရှိနိုင်မည့် အရင်းအမြစ်များကို စာရင်းပြုစုပြီး မည်မျှကြာအောင် ခံနိုင်မည် တွက်ကြည့်ပါ။ ယနေ့ပင် ဖြေရှင်းရန် မလိုပါ၊ လိုအပ်ချက်ကို မှတ်ထားရုံဖြင့် လုံလောက်ပါသည်။",
    },
  },
};

/** Earlier deadlines go to the higher-ranked risks. */
const TIMEFRAMES: Record<SupportedLanguage, string[]> = {
  en: ["This week", "Within one month", "Within three months"],
  my: ["ဒီအပတ်အတွင်း", "တစ်လအတွင်း", "သုံးလအတွင်း"],
};

const LATIN_TO_MYANMAR_DIGITS = "၀၁၂၃၄၅၆၇၈၉";

export function localizeNumber(value: number, language: SupportedLanguage): string {
  const text = String(value);
  if (language !== "my") return text;
  return text.replace(/\d/g, (digit) => LATIN_TO_MYANMAR_DIGITS[Number(digit)]);
}

function planStep(risk: RiskScore, rank: number, language: SupportedLanguage): LifePlanStep {
  const step = CATEGORY_STEPS[risk.category][language];
  const timeframes = TIMEFRAMES[language];
  return {
    title: step.title,
    detail: step.detail,
    timeframe: timeframes[Math.min(rank, timeframes.length - 1)],
    basedOn: risk.contributingFactors[0] ?? risk.explanation,
  };
}

function emptyPlan(language: SupportedLanguage): LifePlanStep[] {
  return language === "my"
    ? [
        {
          title: "လက်ရှိအခြေအနေကို ချရေးပါ",
          detail:
            "ဝင်ငွေ၊ ပုံမှန်ကုန်ကျစရိတ်နှင့် ပေးဆပ်ရန်ကျန်သည့် ချေးငွေများကို စာရွက်တစ်ရွက်တွင် ချရေးပါ။ ထိုအချက်များ ရှိမှသာ ဦးစားပေးအဆင့် သတ်မှတ်နိုင်ပါမည်။",
          timeframe: TIMEFRAMES.my[0],
          basedOn: "ယခုအထိ ရရှိထားသည့် အချက်အလက် အကန့်အသတ်ရှိနေခြင်း",
        },
      ]
    : [
        {
          title: "Write your current position down on one page",
          detail:
            "List your income, your regular outgoings and any loans still to repay. Ranking anything is guesswork until those three are written down.",
          timeframe: TIMEFRAMES.en[0],
          basedOn: "the limited detail captured so far",
        },
      ];
}

/**
 * Built entirely from the deterministic risk engine, so the customer still
 * gets a real readout and a real plan when the model is rate-limited or down.
 * Uses contributing factors rather than the full risk explanation, because the
 * explanation carries a disclaimer suffix that would repeat on every line.
 */
export function fallbackSummary(
  context: LifeContext,
  language: SupportedLanguage,
): LifeSummary {
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

  const plan = top.length
    ? top.map((risk, index) => planStep(risk, index, language))
    : emptyPlan(language);

  if (language === "my") {
    return {
      headline: leadLabel
        ? `သင့်အခြေအနေတွင် ${leadLabel} က အရေးအကြီးဆုံး ဖြစ်နေပါသည်`
        : "သင်ပြောပြထားချက်များအရ လက်ရှိအခြေအနေ",
      situation: `မေးခွန်း ${answered} ခုကို ဖြေပြီးပါပြီ။ ထိုအဖြေများအရ အောက်ပါနယ်ပယ်များကို အစဉ်လိုက် ဦးစားပေး ကြည့်သင့်ပါသည်။ ဤဂဏန်းများသည် မည်သည့်အရာကို အရင်ကြည့်သင့်သည်ကို ပြသည့် အညွှန်းသာ ဖြစ်ပြီး မလုံခြုံမှု ရာခိုင်နှုန်း မဟုတ်ပါ။`,
      priorities,
      plan,
      caution:
        "ဤအချက်များသည် သင်ပြောပြထားသည့် အချက်အလက်များအပေါ်တွင်သာ အခြေခံပါသည်။ အရေးကြီးသော ဆုံးဖြတ်ချက်များအတွက် ကျွမ်းကျင်ပညာရှင်တစ်ဦးနှင့် တိုင်ပင်ဆွေးနွေးသင့်ပါသည်။",
    };
  }

  return {
    headline: leadLabel
      ? `${leadLabel} is what your answers point to first`
      : "Where you stand, based on what you shared",
    situation: `You answered ${answered} questions. Those answers rank the areas below in the order worth your attention. These numbers are a sequencing signal, not a measure of being unsafe.`,
    priorities,
    plan,
    caution:
      "This is based only on what you shared here. Any major decision is worth discussing with a qualified professional.",
  };
}
