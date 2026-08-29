import type { SupportedLanguage } from "@/lib/types/life-context";
import { toMyanmarDigits } from "./money";

/**
 * The stored LifeContext keeps English technical values on purpose — switching
 * language must not change a single fact or score. That leaves the UI holding
 * strings like "2 years" and "emergency savings", which a Burmese reader
 * should never see. Translation happens here, at the moment of display.
 *
 * Anything not in these tables falls through unchanged. A stray English word
 * is a smaller failure than dropping information the customer gave us.
 */

const UNKNOWNS: Record<string, string> = {
  "emergency savings": "အရေးပေါ်စုငွေ",
  "emergency fund": "အရေးပေါ်ရန်ပုံငွေ",
  "education savings": "ပညာရေးစုငွေ",
  "education cost": "ပညာရေးကုန်ကျစရိတ်",
  "care sharing": "စောင့်ရှောက်မှု တာဝန်ခွဲဝေမှု",
  "mortgage amount": "အိမ်ချေးငွေ ပမာဏ",
  "monthly income": "လစဉ်ဝင်ငွေ",
  "monthly expenses": "လစဉ်အသုံးစရိတ်",
  "monthly saving capacity": "တစ်လ စုနိုင်သည့်ပမာဏ",
  "income structure": "ဝင်ငွေဖွဲ့စည်းပုံ",
  "current pressure": "လက်ရှိ ဖိအားအဓိက",
  "due date": "မွေးဖွားမည့်ရက်",
  "retirement age": "အငြိမ်းစားယူမည့်အသက်",
  "retirement spending need": "အငြိမ်းစားကာလ သုံးစွဲမှုလိုအပ်ချက်",
  "health insurance": "ကျန်းမာရေးအာမခံ",
  "existing protection": "ရှိပြီးသား အကာအကွယ်",
};

/**
 * Focus names written by the model already arrive in the right language, so
 * they fall through untouched. This only catches the curated ones, which are
 * authored once in English and shown in both.
 */
const FOCUS: Record<string, string> = {
  "education planning": "ပညာရေး ပြင်ဆင်မှု",
  education: "ပညာရေး",
  retirement: "အငြိမ်းစား",
  "financial resilience": "ငွေကြေး ခံနိုင်ရည်",
  finance: "ငွေကြေး",
  "family care": "မိသားစု စောင့်ရှောက်မှု",
  family: "မိသားစု",
  housing: "နေထိုင်မှု",
  health: "ကျန်းမာရေး",
  "health care": "ကျန်းမာရေးနှင့် စောင့်ရှောက်မှု",
  protection: "အကာအကွယ်",
};

export function focusLabel(value: string, language: SupportedLanguage): string {
  if (language !== "my") return value;
  return FOCUS[value.trim().toLowerCase()] ?? value;
}

const LEVELS: Record<string, string> = {
  LOW: "နည်း",
  MEDIUM: "အသင့်အတင့်",
  HIGH: "မြင့်",
  CRITICAL: "အလွန်မြင့်",
};

export function levelLabel(value: string, language: SupportedLanguage): string {
  if (language !== "my") return value;
  return LEVELS[value] ?? value;
}

const HORIZON_PHRASES: Record<string, string> = {
  soon: "မကြာမီ",
  immediately: "ချက်ချင်း",
  now: "ယခု",
  "next week": "နောက်အပတ်",
  "next month": "နောက်လ",
  "next year": "နောက်နှစ်",
  yesterday: "မနေ့က",
  ongoing: "ဆက်လက်ဖြစ်ပေါ်နေဆဲ",
  unknown: "မသေချာသေး",
};

const HORIZON_UNITS: [RegExp, string][] = [
  [/years?|yrs?/i, "နှစ်"],
  [/months?|mos?/i, "လ"],
  [/weeks?/i, "ပတ်"],
  [/days?/i, "ရက်"],
];

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function unknownLabel(value: string, language: SupportedLanguage): string {
  if (language !== "my") return value;
  return UNKNOWNS[value.trim().toLowerCase()] ?? value;
}

/** "2 years" becomes ၂ နှစ်; "soon" becomes မကြာမီ. */
export function horizonLabel(value: string, language: SupportedLanguage): string {
  if (language !== "my") return value;

  const text = value.trim().toLowerCase();
  const phrase = HORIZON_PHRASES[text];
  if (phrase) return phrase;

  const digits = text.match(/(\d+(?:\.\d+)?)/);
  const word = Object.keys(WORD_NUMBERS).find((key) => new RegExp(`\\b${key}\\b`).test(text));
  const amount = digits ? Number(digits[1]) : word ? WORD_NUMBERS[word] : undefined;
  if (amount === undefined) return value;

  const unit = HORIZON_UNITS.find(([pattern]) => pattern.test(text))?.[1];
  if (!unit) return value;

  const within = /within|under|less than|အတွင်း/i.test(text);
  const rendered = `${toMyanmarDigits(String(amount))} ${unit}`;
  return within ? `${rendered}အတွင်း` : rendered;
}
