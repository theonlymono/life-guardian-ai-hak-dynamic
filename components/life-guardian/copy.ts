import type { RiskCategory, SupportedLanguage } from "@/lib/types/life-context"

/** UI chrome only. Everything the AI produces is already localized by the backend. */
export const UI_COPY = {
  en: {
    promptPlaceholder: "Tell me what is changing in your life today...",
    promptPlaceholderOngoing: "Tell me something new about your life...",
    todayFocus: "Today's focus",
    minutes: "min",
    yourAnswer: "Your answer",
    typeAnswer: "Type your answer",
    enterNumber: "Enter a number",
    send: "Send",
    yes: "Yes",
    no: "No",
    skip: "Ask me something else",
    lifePulse: "Life Pulse",
    lifePulseEmpty: "Share your situation and your Life Pulse will appear here.",
    pulseNote:
      "Scores prioritize what to look at first. They are not a percentage of being unsafe.",
    completedActions: "Completed actions",
    completedEmpty: "Answers you give will be remembered here.",
    history: "History",
    historyEmpty: "Your conversation will appear here.",
    whatChanged: "What changed",
    knownAbout: "What Life Guardian knows",
    age: "Age",
    dependents: "Dependents",
    income: "Income",
    single_income: "Single income",
    dual_income: "Dual income",
    unknown: "Unknown",
    stillNeeded: "Still worth sharing",
    followUpScheduled: "Follow-up scheduled in n8n",
    followUpUnavailable: "Follow-up automation is offline. Your answer was still saved.",
    demoBackup: "Demo backup mode — deterministic sample, not live AI",
    thinking: "Thinking...",
    newSession: "New",
    startOver: "Start over",
  },
  my: {
    promptPlaceholder: "ဒီနေ့ သင့်ဘဝမှာ ဘာတွေ ပြောင်းလဲနေလဲ ပြောပြပါ...",
    promptPlaceholderOngoing: "သင့်ဘဝအကြောင်း အသစ်တစ်ခုခု ပြောပြပါ...",
    todayFocus: "ဒီနေ့ အာရုံစိုက်ရမယ့်အရာ",
    minutes: "မိနစ်",
    yourAnswer: "သင့်အဖြေ",
    typeAnswer: "အဖြေကို ရိုက်ထည့်ပါ",
    enterNumber: "ဂဏန်း ထည့်ပါ",
    send: "ပို့မည်",
    yes: "ဟုတ်ကဲ့",
    no: "မဟုတ်ပါ",
    skip: "တခြားတစ်ခု မေးပါ",
    lifePulse: "ဘဝအခြေအနေ",
    lifePulseEmpty: "သင့်အခြေအနေကို ပြောပြပါ၊ ဘဝအခြေအနေ ဒီမှာ ပေါ်လာပါမယ်။",
    pulseNote:
      "ဒီအမှတ်တွေက ဘာကို အရင်ကြည့်သင့်လဲ ဆိုတာ အစီအစဉ်ချပေးတာပါ။ မလုံခြုံမှု ရာခိုင်နှုန်း မဟုတ်ပါ။",
    completedActions: "ပြီးစီးပြီးသော လုပ်ဆောင်ချက်များ",
    completedEmpty: "သင်ဖြေထားတဲ့ အဖြေတွေကို ဒီမှာ မှတ်ထားပါမယ်။",
    history: "မှတ်တမ်း",
    historyEmpty: "သင့်စကားဝိုင်း ဒီမှာ ပေါ်လာပါမယ်။",
    whatChanged: "ပြောင်းလဲသွားတာများ",
    knownAbout: "Life Guardian သိထားသည်များ",
    age: "အသက်",
    dependents: "မှီခိုသူ",
    income: "ဝင်ငွေ",
    single_income: "ဝင်ငွေတစ်ခုတည်း",
    dual_income: "ဝင်ငွေနှစ်ခု",
    unknown: "မသိရသေး",
    stillNeeded: "ထပ်ပြောပြသင့်သည်များ",
    followUpScheduled: "n8n မှာ နောက်ဆက်တွဲ စီစဉ်ပြီးပါပြီ",
    followUpUnavailable: "နောက်ဆက်တွဲ စနစ် ပိတ်နေပါတယ်။ သင့်အဖြေကိုတော့ သိမ်းထားပါပြီ။",
    demoBackup: "Demo backup mode — နမူနာသာ၊ live AI မဟုတ်ပါ",
    thinking: "စဉ်းစားနေပါတယ်...",
    newSession: "အသစ်",
    startOver: "အစကပြန်စမည်",
  },
} as const satisfies Record<SupportedLanguage, Record<string, string>>

export const CATEGORY_LABELS: Record<
  RiskCategory,
  Record<SupportedLanguage, string>
> = {
  finance: { en: "Finance", my: "ငွေကြေး" },
  family: { en: "Family", my: "မိသားစု" },
  healthCare: { en: "Health & Care", my: "ကျန်းမာရေးနှင့် စောင့်ရှောက်မှု" },
  education: { en: "Education", my: "ပညာရေး" },
  housing: { en: "Housing", my: "အိမ်ရာ" },
}

export function t(language: SupportedLanguage) {
  return UI_COPY[language]
}
