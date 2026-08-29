import type { RiskCategory, SupportedLanguage } from "@/lib/types/life-context"

/**
 * UI chrome only — everything the AI writes is already localized by the backend.
 * Both languages must define the same keys so switching never adds or removes
 * an element and the layout stays put.
 */
export const UI_COPY = {
  en: {
    newSession: "New",
    today: "Today",
    lifePulse: "Life Pulse",
    knownAbout: "What I know",
    completedActions: "Actions",
    untitled: "New conversation",

    promptPlaceholder: "Tell me what is changing in your life today...",
    promptPlaceholderOngoing: "Tell me something new...",
    send: "Send",
    thinking: "Working on it",
    startOver: "Start over",
    dictate: "Speak instead of typing",
    dictateHint:
      "The box is focused. Hold your system dictation hotkey (Wispr Flow) and speak — the words land here, then press Enter.",

    stepRead: "Reading your life story",
    stepUnderstand: "Understanding your answer",
    stepMerge: "Merging what changed",
    stepRisk: "Recalculating Life Pulse",
    stepAction: "Choosing your next action",

    riskMoved: "moved",
    whatChanged: "What changed",
    yourAnswer: "Answer",
    minutes: "min",
    typeAnswer: "Type your answer",
    enterNumber: "Enter a number",
    yes: "Yes",
    no: "No",

    questionProgress: "Question",
    of: "of",
    summaryDone: "All questions answered",
    whatMattersMost: "What matters most",
    considerNext: "Worth considering",
    summaryFooter:
      "Tell me anything that changes and I will update this. Life Guardian is not a financial adviser.",

    lifePulseEmpty: "Share your situation and your Life Pulse appears here.",
    pulseNote: "Scores rank what to look at first. They are not a risk percentage.",
    completedEmpty: "Answers you give are remembered here.",
    knownEmpty: "Facts you share are collected here.",
    stillNeeded: "Still worth sharing",

    age: "Age",
    dependents: "Dependents",
    income: "Income",
    single_income: "Single income",
    dual_income: "Dual income",
    unknown: "Not known",

    followUpScheduled: "Follow-up scheduled",
    followUpUnavailable: "Follow-up offline, answer saved",
    demoBackup: "Demo backup — sample output, not live AI",
  },
  my: {
    newSession: "အသစ်",
    today: "ဒီနေ့",
    lifePulse: "ဘဝအခြေအနေ",
    knownAbout: "သိထားသည်များ",
    completedActions: "လုပ်ဆောင်ချက်",
    untitled: "စကားဝိုင်းအသစ်",

    promptPlaceholder: "ဒီနေ့ သင့်ဘဝမှာ ဘာပြောင်းလဲနေလဲ ပြောပြပါ...",
    promptPlaceholderOngoing: "အသစ်တစ်ခုခု ပြောပြပါ...",
    send: "ပို့မည်",
    thinking: "ဆောင်ရွက်နေသည်",
    startOver: "အစကပြန်စမည်",
    dictate: "စာမရိုက်ဘဲ ပြောမည်",
    dictateHint:
      "အကွက်ကို ရွေးထားပြီးပါပြီ။ စက်ရဲ့ dictation hotkey (Wispr Flow) ကို ဖိပြီး ပြောလိုက်ပါ — စာက ဒီမှာ ဝင်လာမည်၊ ပြီးရင် Enter နှိပ်ပါ။",

    stepRead: "သင့်ဘဝအကြောင်း ဖတ်နေသည်",
    stepUnderstand: "သင့်အဖြေကို နားလည်နေသည်",
    stepMerge: "ပြောင်းလဲမှုများ ပေါင်းစပ်နေသည်",
    stepRisk: "ဘဝအခြေအနေ ပြန်တွက်နေသည်",
    stepAction: "နောက်လုပ်ဆောင်ချက် ရွေးနေသည်",

    riskMoved: "ပြောင်းသွားသည်",
    whatChanged: "ပြောင်းလဲသွားသည်များ",
    yourAnswer: "အဖြေ",
    minutes: "မိနစ်",
    typeAnswer: "အဖြေ ရိုက်ထည့်ပါ",
    enterNumber: "ဂဏန်း ထည့်ပါ",
    yes: "ဟုတ်ကဲ့",
    no: "မဟုတ်ပါ",

    questionProgress: "မေးခွန်း",
    of: "/",
    summaryDone: "မေးခွန်းအားလုံး ဖြေပြီးပါပြီ",
    whatMattersMost: "အရေးအကြီးဆုံး",
    considerNext: "စဉ်းစားသင့်သည်",
    summaryFooter:
      "ပြောင်းလဲမှုရှိရင် ပြောပြပါ၊ ဒါကို ပြန်မွမ်းမံပေးမည်။ Life Guardian သည် ငွေကြေးအကြံပေးပညာရှင် မဟုတ်ပါ။",

    lifePulseEmpty: "အခြေအနေ ပြောပြပါ၊ ဘဝအခြေအနေ ဒီမှာ ပေါ်လာမည်။",
    pulseNote: "အမှတ်များက ဘာကို အရင်ကြည့်ရမလဲ အစီအစဉ်ချပေးသည်။ အန္တရာယ် ရာခိုင်နှုန်း မဟုတ်ပါ။",
    completedEmpty: "သင်ဖြေထားသည်များကို ဒီမှာ မှတ်ထားမည်။",
    knownEmpty: "သင်ပြောပြသည့် အချက်များ ဒီမှာ စုထားမည်။",
    stillNeeded: "ထပ်ပြောပြသင့်သည်",

    age: "အသက်",
    dependents: "မှီခိုသူ",
    income: "ဝင်ငွေ",
    single_income: "ဝင်ငွေတစ်ခု",
    dual_income: "ဝင်ငွေနှစ်ခု",
    unknown: "မသိရသေး",

    followUpScheduled: "နောက်ဆက်တွဲ စီစဉ်ပြီး",
    followUpUnavailable: "နောက်ဆက်တွဲ ပိတ်နေသည်၊ အဖြေ သိမ်းပြီး",
    demoBackup: "Demo backup — နမူနာသာ၊ live AI မဟုတ်",
  },
} as const satisfies Record<SupportedLanguage, Record<string, string>>

export const CATEGORY_LABELS: Record<
  RiskCategory,
  Record<SupportedLanguage, string>
> = {
  finance: { en: "Finance", my: "ငွေကြေး" },
  family: { en: "Family", my: "မိသားစု" },
  healthCare: { en: "Health", my: "ကျန်းမာရေး" },
  education: { en: "Education", my: "ပညာရေး" },
  housing: { en: "Housing", my: "အိမ်ရာ" },
}

export function t(language: SupportedLanguage) {
  return UI_COPY[language]
}
