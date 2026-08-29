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
    yourPlan: "Your plan",
    basedOn: "Because",
    summaryFooter: "Tell me anything that changes and I will update this plan.",

    accountKept: "Kept on this device. No sign-in needed.",
    deleteChat: "Delete this conversation",
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Sign up",
    logIn: "Log in",
    authTitleIn: "Log in",
    authTitleUp: "Create an account",
    username: "Username",
    password: "Password",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    authGuestNote: "You don't need an account. Signing in only carries your history to another device.",
    authRules: "3–30 characters. Password at least 8.",
    authNoReset: "No email is collected, so a forgotten password cannot be reset.",
    authTaken: "That username is taken.",
    authInvalid: "Check the username and password rules below.",
    authBadCredentials: "That username and password do not match.",
    authUnavailable: "Accounts are unavailable right now. You can keep going as a guest.",
    authClose: "Close",
    authWorking: "Working…",

    offerQuestion: "Would you like to see insurance that fits this?",
    offerNote:
      "Products published by Daiichi Life Myanmar. Shown for information only — this is not advice and nothing is applied for here.",
    offerYes: "Show me",
    offerNo: "Not now",
    offerEmpty: "Nothing in the range clearly fits what you have told me so far.",
    offerAgeNote: "Their published entry age does not cover your age — worth asking about.",
    offerBrochure: "Brochure",
    offerContact: "Daiichi Life Myanmar customer service",
    offerDisclaimer:
      "Premiums depend on details we have not asked for. Speak to a licensed adviser before deciding anything.",

    projection: "Your projection",
    saved: "Saved so far",
    target: "Target",
    projected: "On this pace",
    gap: "Short by",
    onTrack: "On track to reach it",
    perMonth: "a month",
    scenarioCurrent: "Your pace",
    scenarioRequired: "To reach it in time",
    scenarioMoreTime: "Same pace, more time",
    months: "months",
    whatIf: "What if I save",
    whatIfHint: "Change the amount to see the gap move. Nothing is saved until you answer a question.",
    projectionNote: "Straight addition of what you set aside. No investment return is assumed.",

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
    yourPlan: "သင်လုပ်ရမည့် အစီအစဉ်",
    basedOn: "အကြောင်းရင်း",
    summaryFooter: "ပြောင်းလဲမှုရှိပါက ပြောပြပါ၊ ဤအစီအစဉ်ကို ပြန်မွမ်းမံပေးပါမည်။",

    accountKept: "ဒီစက်ထဲမှာ သိမ်းထားပါသည်။ Login ဝင်စရာမလိုပါ။",
    deleteChat: "ဤစကားဝိုင်းကို ဖျက်ရန်",
    signIn: "ဝင်ရန်",
    signOut: "ထွက်ရန်",
    signUp: "အကောင့်ဖွင့်ရန်",
    logIn: "ဝင်ရန်",
    authTitleIn: "အကောင့်ဝင်ရန်",
    authTitleUp: "အကောင့်အသစ်ဖွင့်ရန်",
    username: "အသုံးပြုသူအမည်",
    password: "စကားဝှက်",
    haveAccount: "အကောင့်ရှိပြီးသားလား။",
    noAccount: "အကောင့်မရှိသေးဘူးလား။",
    authGuestNote:
      "အကောင့်မလိုအပ်ပါ။ အကောင့်ဝင်ခြင်းက သင့်မှတ်တမ်းကို အခြားစက်တစ်ခုသို့ သယ်ဆောင်ရန်သာ ဖြစ်ပါသည်။",
    authRules: "စာလုံး ၃ လုံးမှ ၃၀ လုံး။ စကားဝှက် အနည်းဆုံး ၈ လုံး။",
    authNoReset: "အီးမေးလ် မကောက်ယူသဖြင့် စကားဝှက်မေ့သွားပါက ပြန်လည်သတ်မှတ်၍ မရပါ။",
    authTaken: "ဤအမည်ကို အသုံးပြုပြီးဖြစ်ပါသည်။",
    authInvalid: "အောက်ပါ စည်းမျဉ်းများနှင့် ကိုက်ညီအောင် ပြင်ပါ။",
    authBadCredentials: "အသုံးပြုသူအမည် သို့မဟုတ် စကားဝှက် မမှန်ပါ။",
    authUnavailable: "အကောင့်စနစ်ကို ယခု အသုံးပြု၍ မရသေးပါ။ ဧည့်သည်အဖြစ် ဆက်လက်သုံးနိုင်ပါသည်။",
    authClose: "ပိတ်ရန်",
    authWorking: "ဆောင်ရွက်နေသည်…",

    offerQuestion: "ဒီအခြေအနေနဲ့ ကိုက်ညီမယ့် အာမခံတွေ ကြည့်ချင်ပါသလား။",
    offerNote:
      "Daiichi Life Myanmar မှ ထုတ်ပြန်ထားသော ဝန်ဆောင်မှုများ ဖြစ်ပါသည်။ အချက်အလက်အဖြစ်သာ ဖော်ပြခြင်းဖြစ်ပြီး အကြံပြုချက် မဟုတ်ပါ။ ဤနေရာတွင် လျှောက်ထားခြင်း မရှိပါ။",
    offerYes: "ပြပါ",
    offerNo: "ယခုမလိုသေးပါ",
    offerEmpty: "ယခုအထိ ပြောပြထားသည့် အချက်အလက်များနှင့် ထင်ရှားစွာ ကိုက်ညီသည့် ဝန်ဆောင်မှု မတွေ့ရသေးပါ။",
    offerAgeNote: "ထုတ်ပြန်ထားသည့် အသက်ကန့်သတ်ချက်နှင့် မကိုက်ညီပါ — မေးမြန်းကြည့်သင့်ပါသည်။",
    offerBrochure: "လက်ကမ်းစာစောင်",
    offerContact: "Daiichi Life Myanmar ဖောက်သည်ဝန်ဆောင်မှု",
    offerDisclaimer:
      "ပရီမီယံနှုန်းထားများသည် ကျွန်ုပ်တို့ မမေးထားသည့် အသေးစိတ်အချက်များအပေါ် မူတည်ပါသည်။ ဆုံးဖြတ်ချက်မချမီ လိုင်စင်ရ ပညာရှင်တစ်ဦးနှင့် တိုင်ပင်ပါ။",

    projection: "သင့်တွက်ချက်မှု",
    saved: "စုပြီးသား",
    target: "ရည်မှန်းချက်",
    projected: "ဒီနှုန်းအတိုင်းဆို",
    gap: "လိုနေသေးသည်",
    onTrack: "ရည်မှန်းချက် ပြည့်မီနိုင်ပါသည်",
    perMonth: "တစ်လ",
    scenarioCurrent: "သင့်နှုန်း",
    scenarioRequired: "အချိန်မီရဖို့",
    scenarioMoreTime: "နှုန်းအတူတူ၊ အချိန်ပိုယူ",
    months: "လ",
    whatIf: "တစ်လ ဒီလောက်စုရင်",
    whatIfHint: "ပမာဏပြောင်းကြည့်ပါ၊ လိုငွေ ဘယ်လိုပြောင်းလဲ တွေ့ရမည်။ မေးခွန်းမဖြေမချင်း ဘာမှ မမှတ်ထားပါ။",
    projectionNote: "ဖယ်ထားတဲ့ငွေကို အတိအကျ ပေါင်းထားခြင်းသာ ဖြစ်သည်။ အမြတ်အစွန်း တွက်ထားခြင်း မရှိပါ။",

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
