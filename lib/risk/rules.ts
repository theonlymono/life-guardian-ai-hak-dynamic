import type { SupportedLanguage } from "@/lib/types/life-context";

export const RISK_CATEGORIES = [
  "finance",
  "family",
  "healthCare",
  "education",
  "housing",
] as const;

export type RiskRuleId =
  | "single_income"
  | "job_income_loss"
  | "two_plus_dependents"
  | "major_mortgage"
  | "education_within_3_years"
  | "aging_parent_70_plus"
  | "emergency_savings_under_3_months"
  | "retirement_within_5_years"
  | "new_baby_or_pregnancy";

export interface RiskRule {
  id: RiskRuleId;
  finance?: number;
  family?: number;
  healthCare?: number;
  education?: number;
  housing?: number;
}

export const RISK_RULES: RiskRule[] = [
  { id: "single_income", finance: 20 },
  { id: "job_income_loss", finance: 30 },
  { id: "two_plus_dependents", finance: 15, family: 15 },
  { id: "major_mortgage", finance: 20, housing: 20 },
  { id: "education_within_3_years", education: 30, finance: 10 },
  { id: "aging_parent_70_plus", healthCare: 20, family: 10 },
  { id: "emergency_savings_under_3_months", finance: 25 },
  { id: "retirement_within_5_years", finance: 20 },
  { id: "new_baby_or_pregnancy", family: 20, finance: 10, healthCare: 10 },
];

export const FACTOR_COPY: Record<
  RiskRuleId,
  Record<SupportedLanguage, string>
> = {
  single_income: {
    en: "Household currently depends on a single income.",
    my: "အိမ်ထောင်စုဝင်ငွေက လူတစ်ဦးတည်းအပေါ် မူတည်နေပါတယ်။",
  },
  job_income_loss: {
    en: "A recent job or income disruption increases near-term financial pressure.",
    my: "အလုပ် သို့မဟုတ် ဝင်ငွေ ရပ်တန့်မှုက အနီးစပ်ဆုံး ငွေကြေးဖိအားကို တိုးစေပါတယ်။",
  },
  two_plus_dependents: {
    en: "Two or more dependents currently rely on this household.",
    my: "မှီခိုသူ နှစ်ဦး သို့မဟုတ် ထို့ထက်ပိုပြီး ဒီအိမ်ထောင်စုအပေါ် မူတည်နေပါတယ်။",
  },
  major_mortgage: {
    en: "An existing mortgage remains a significant housing commitment.",
    my: "ရှိပြီးသား အိမ်ချေးငွေက အရေးကြီးတဲ့ နေထိုင်မှုတာဝန်အဖြစ် ကျန်ရှိနေပါတယ်။",
  },
  education_within_3_years: {
    en: "A major education milestone is approaching within three years.",
    my: "ပညာရေးဆိုင်ရာ အရေးကြီးအဆင့်တစ်ခုက နောက် ၃ နှစ်အတွင်း ရောက်လာတော့မှာပါ။",
  },
  aging_parent_70_plus: {
    en: "An aging parent aged 70 or older may need care support.",
    my: "အသက် ၇၀ နှင့်အထက် မိဘတစ်ဦးအတွက် စောင့်ရှောက်မှု လိုအပ်လာနိုင်ပါတယ်။",
  },
  emergency_savings_under_3_months: {
    en: "Known emergency savings appear to cover fewer than three months of essentials.",
    my: "သိရှိထားတဲ့ အရေးပေါ်စုငွေက မရှိမဖြစ်ကုန်ကျစရိတ် ၃ လစာ မပြည့်သေးပါဘူး။",
  },
  retirement_within_5_years: {
    en: "Retirement appears to be within the next five years.",
    my: "အငြိမ်းစားယူမယ့်အချိန်က နောက် ၅ နှစ်အတွင်း ရှိနေပုံရပါတယ်။",
  },
  new_baby_or_pregnancy: {
    en: "A pregnancy or new child is expanding family responsibilities.",
    my: "ကိုယ်ဝန်ဆောင်ခြင်း သို့မဟုတ် ကလေးအသစ်က မိသားစုတာဝန်တွေကို တိုးစေပါတယ်။",
  },
};

export function riskLevelFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

export function capScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
