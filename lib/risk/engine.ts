import type {
  CompletedAction,
  FinancialCommitment,
  LifeContext,
  LifeEvent,
  RiskScore,
  SupportedLanguage,
} from "@/lib/types/life-context";
import {
  FACTOR_COPY,
  RISK_CATEGORIES,
  RISK_RULES,
  capScore,
  riskLevelFromScore,
  type RiskRuleId,
} from "@/lib/risk/rules";

const JOB_LOSS = /job[_\s-]?loss|unemploy|income[_\s-]?loss|lost.{0,20}job|laid[_\s-]?off/i;
const MORTGAGE = /mortgage|housing[_\s-]?loan|home[_\s-]?loan|အိမ်ချေး/i;
const EDUCATION = /education|university|college|school|tuition|ပညာရေး|တက္ကသိုလ်/i;
const CARE = /aging[_\s-]?parent|elder|care|father|mother|parent|အဖေ|အမိ|စောင့်ရှောက်/i;
const PREGNANCY = /pregnan|new[_\s-]?child|new[_\s-]?baby|expecting|first baby|ကိုယ်ဝန်|ကလေးအသစ်/i;
const RETIREMENT = /retir/i;
const EMERGENCY = /emergency[_\s-]?(fund|saving)|essential expenses|months of/i;

export function calculateRisks(
  context: Pick<
    LifeContext,
    "profile" | "lifeEvents" | "commitments" | "completedActions"
  >,
  language: SupportedLanguage = "en",
): RiskScore[] {
  const matched = detectMatchedRules(context);
  const totals: Record<(typeof RISK_CATEGORIES)[number], number> = {
    finance: 0,
    family: 0,
    healthCare: 0,
    education: 0,
    housing: 0,
  };
  const factors: Record<(typeof RISK_CATEGORIES)[number], string[]> = {
    finance: [],
    family: [],
    healthCare: [],
    education: [],
    housing: [],
  };

  for (const rule of RISK_RULES) {
    if (!matched.has(rule.id)) continue;
    const copy = FACTOR_COPY[rule.id][language];
    for (const category of RISK_CATEGORIES) {
      const add = rule[category];
      if (!add) continue;
      totals[category] += add;
      factors[category].push(copy);
    }
  }

  return RISK_CATEGORIES.map((category) => {
    const score = capScore(totals[category]);
    return {
      category,
      score,
      level: riskLevelFromScore(score),
      explanation: explanationFor(category, score, factors[category], language),
      contributingFactors: factors[category],
    };
  });
}

export function detectMatchedRules(
  context: Pick<
    LifeContext,
    "profile" | "lifeEvents" | "commitments" | "completedActions"
  >,
): Set<RiskRuleId> {
  const matched = new Set<RiskRuleId>();
  const { profile, lifeEvents, commitments, completedActions } = context;

  if (profile.incomeStructure === "single_income") {
    matched.add("single_income");
  }
  if (lifeEvents.some((event) => JOB_LOSS.test(`${event.type} ${event.description}`))) {
    matched.add("job_income_loss");
  }
  if ((profile.dependents ?? 0) >= 2) {
    matched.add("two_plus_dependents");
  }
  if (commitments.some((item) => MORTGAGE.test(`${item.type} ${item.description}`))) {
    matched.add("major_mortgage");
  }
  if (
    lifeEvents.some((event) => {
      const text = `${event.type} ${event.description}`;
      return EDUCATION.test(text) && isWithinYears(event.timeHorizon, 3);
    })
  ) {
    matched.add("education_within_3_years");
  }
  if (lifeEvents.some((event) => isAgingParent70Plus(event))) {
    matched.add("aging_parent_70_plus");
  }
  if (hasEmergencySavingsUnder3Months(commitments, completedActions)) {
    matched.add("emergency_savings_under_3_months");
  }
  if (isRetirementWithin5Years(profile.age, lifeEvents, completedActions)) {
    matched.add("retirement_within_5_years");
  }
  if (lifeEvents.some((event) => PREGNANCY.test(`${event.type} ${event.description}`))) {
    matched.add("new_baby_or_pregnancy");
  }

  return matched;
}

function isAgingParent70Plus(event: LifeEvent): boolean {
  const text = `${event.type} ${event.description} ${event.timeHorizon ?? ""}`;
  if (!CARE.test(text)) return false;
  const age = extractFirstAge(text);
  if (age !== undefined) return age >= 70;
  return /aging[_\s-]?parent|elder[_\s-]?care/i.test(`${event.type} ${event.description}`);
}

function hasEmergencySavingsUnder3Months(
  commitments: FinancialCommitment[],
  completedActions: CompletedAction[],
): boolean {
  const monthsFromCommitments = commitments
    .filter((item) => EMERGENCY.test(`${item.type} ${item.description}`))
    .map((item) => item.amount)
    .find((value) => typeof value === "number");
  if (typeof monthsFromCommitments === "number" && monthsFromCommitments < 3) {
    return true;
  }

  for (const action of completedActions) {
    const blob = `${action.question} ${String(action.answer)} ${action.topicKey ?? ""}`;
    if (!EMERGENCY.test(blob) && action.topicKey !== "emergency_fund_months") {
      continue;
    }
    const months = parseMonths(String(action.answer));
    if (months !== undefined && months < 3) return true;
  }
  return false;
}

function isRetirementWithin5Years(
  age: number | undefined,
  events: LifeEvent[],
  completedActions: CompletedAction[],
): boolean {
  const retirementEvent = events.find((event) =>
    RETIREMENT.test(`${event.type} ${event.description}`),
  );
  if (retirementEvent && isWithinYears(retirementEvent.timeHorizon, 5)) {
    return true;
  }
  const statedRetirementAge = completedActions
    .map((action) => {
      if (action.topicKey !== "retirement_age") return undefined;
      const value = Number(action.answer);
      return Number.isFinite(value) ? value : extractFirstAge(String(action.answer));
    })
    .find((value) => typeof value === "number");
  if (typeof age === "number" && typeof statedRetirementAge === "number") {
    return statedRetirementAge - age <= 5 && statedRetirementAge - age >= 0;
  }
  if (typeof age === "number") {
    const eventAge = events
      .map((event) => extractFirstAge(`${event.description} ${event.timeHorizon ?? ""}`))
      .find((value) => typeof value === "number" && value > age);
    if (typeof eventAge === "number") {
      return eventAge - age <= 5;
    }
  }
  return false;
}

export function isWithinYears(timeHorizon: string | undefined, years: number): boolean {
  if (!timeHorizon) return false;
  const parsed = parseYearHorizon(timeHorizon);
  return parsed !== undefined && parsed <= years;
}

export function parseYearHorizon(timeHorizon: string): number | undefined {
  const years = timeHorizon.match(/(\d+(?:\.\d+)?)\s*(year|yr|နှစ်)/i);
  if (years) return Number(years[1]);
  const months = timeHorizon.match(/(\d+(?:\.\d+)?)\s*(month|လ)/i);
  if (months) return Number(months[1]) / 12;
  const weeks = timeHorizon.match(/(\d+(?:\.\d+)?)\s*(week|ပတ်)/i);
  if (weeks) return Number(weeks[1]) / 52;
  if (/immediate|now|today|ယခု|အခု/i.test(timeHorizon)) return 0;
  const bare = Number(timeHorizon);
  return Number.isFinite(bare) ? bare : undefined;
}

export function extractFirstAge(text: string): number | undefined {
  const match = text.match(/\b(1[0-2]\d|[1-9]\d)\b/);
  if (!match) {
    const myanmar = text.match(/([၁-၉][၀-၉])/);
    if (!myanmar) return undefined;
    return myanmarToNumber(myanmar[1]);
  }
  return Number(match[1]);
}

function myanmarToNumber(value: string): number {
  const map: Record<string, string> = {
    "၀": "0",
    "၁": "1",
    "၂": "2",
    "၃": "3",
    "၄": "4",
    "၅": "5",
    "၆": "6",
    "၇": "7",
    "၈": "8",
    "၉": "9",
  };
  return Number([...value].map((char) => map[char] ?? char).join(""));
}

function parseMonths(answer: string): number | undefined {
  const match = answer.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  return Number(match[1]);
}

function explanationFor(
  category: (typeof RISK_CATEGORIES)[number],
  score: number,
  factors: string[],
  language: SupportedLanguage,
): string {
  const labels = {
    finance: { en: "Finance", my: "ငွေကြေး" },
    family: { en: "Family", my: "မိသားစု" },
    healthCare: { en: "Health/Care", my: "ကျန်းမာရေး/စောင့်ရှောက်မှု" },
    education: { en: "Education", my: "ပညာရေး" },
    housing: { en: "Housing", my: "နေထိုင်မှု" },
  } as const;
  const label = labels[category][language];
  if (factors.length === 0) {
    return language === "my"
      ? `${label} အတွက် အရေးပေါ်ဦးစားပေးမှု သိသိသာသာ မတွေ့ရသေးပါဘူး။ ဒီဂဏန်းက မလုံခြုံမှု ရာခိုင်နှုန်း မဟုတ်ပါဘူး။`
      : `${label} currently has no strong priority signals. This number is a sequencing indicator, not a measure of being unsafe.`;
  }
  const joined = factors.join(language === "my" ? " " : " ");
  return language === "my"
    ? `${label} ကို ဦးစားပေးရန် ${joined} ဒီဂဏန်းက ဘယ်အရာကို အရင်ကြည့်သင့်သလဲ ဆိုတာကို ပြပါတယ်။ မလုံခြုံမှု ရာခိုင်နှုန်း မဟုတ်ပါဘူး။`
    : `${label} is sequenced higher because ${joined} This score is only a prioritization signal, not a percentage of being unsafe.`;
}
