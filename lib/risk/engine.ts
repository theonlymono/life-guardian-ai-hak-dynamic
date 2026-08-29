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

/** The model writes horizons as words as often as digits: "two years", "in 2 years". */
const LATIN_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
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
  eleven: 11,
  twelve: 12,
  next: 1,
};

const MYANMAR_WORDS: Record<string, number> = {
  တစ်: 1,
  နှစ်: 2,
  သုံး: 3,
  လေး: 4,
  ငါး: 5,
  ခြောက်: 6,
  ခုနစ်: 7,
  ရှစ်: 8,
  ကိုး: 9,
  ဆယ်: 10,
};

const LATIN_WORD_PATTERN = Object.keys(LATIN_WORDS).join("|");
const MYANMAR_WORD_PATTERN = Object.keys(MYANMAR_WORDS).join("|");
const MYANMAR_DIGITS = "၀၁၂၃၄၅၆၇၈၉";

function myanmarDigitsToLatin(text: string): string {
  return text.replace(/[၀-၉]/g, (digit) => String(MYANMAR_DIGITS.indexOf(digit)));
}

/**
 * Myanmar needs its own pass: JavaScript word boundaries do not apply to Burmese
 * script, so "နှစ်နှစ်" (two years) has to be matched as number + unit directly.
 */
function matchQuantity(
  text: string,
  latinUnits: string,
  myanmarUnit: string,
): number | undefined {
  const normalized = myanmarDigitsToLatin(text);

  const digits = normalized.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${latinUnits}|${myanmarUnit})`, "i"),
  );
  if (digits) return Number(digits[1]);

  const latin = normalized.match(
    new RegExp(`\\b(${LATIN_WORD_PATTERN})\\b[\\s-]*(?:${latinUnits})`, "i"),
  );
  if (latin) return LATIN_WORDS[latin[1].toLowerCase()];

  const myanmar = normalized.match(
    new RegExp(`(${MYANMAR_WORD_PATTERN})\\s*(?:${myanmarUnit})`),
  );
  if (myanmar) return MYANMAR_WORDS[myanmar[1]];

  return undefined;
}

/** Words that state a quantity of zero, which digits alone would miss. */
const ZERO_WORDS =
  /\b(zero|none|nothing|nil|no savings|not any)\b|မရှိ|မစုရသေး|တစ်ခုမှမ/i;

/**
 * True when the text actually contains a quantity — digits in either script, a
 * spelled-out number, or an explicit statement of none.
 *
 * Used to check a model's numeric reading against what the customer really
 * wrote. "I'm working on it" is not zero, and recording it as zero would move
 * their risk score on a figure they never gave.
 */
export function hasNumericEvidence(text: string): boolean {
  const normalized = myanmarDigitsToLatin(text);
  if (/\d/.test(normalized)) return true;
  if (ZERO_WORDS.test(normalized)) return true;
  if (new RegExp(`\\b(${LATIN_WORD_PATTERN})\\b`, "i").test(normalized)) return true;
  return new RegExp(`(${MYANMAR_WORD_PATTERN})`).test(normalized);
}

export function parseYearHorizon(timeHorizon: string): number | undefined {
  const years = matchQuantity(timeHorizon, "years?|yrs?", "နှစ်");
  if (years !== undefined) return years;
  const months = matchQuantity(timeHorizon, "months?", "လ");
  if (months !== undefined) return months / 12;
  const weeks = matchQuantity(timeHorizon, "weeks?", "ပတ်");
  if (weeks !== undefined) return weeks / 52;
  if (/immediate|now|today|soon|this year|ယခု|အခု|မကြာခင်/i.test(timeHorizon)) return 0;
  const bare = Number(myanmarDigitsToLatin(timeHorizon));
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

/**
 * "About one month" and "တစ်လစာ" mean the same thing, so they must produce the
 * same score. Reading only Latin digits here made the emergency-fund rule fire
 * in English but not in Myanmar.
 */
function parseMonths(answer: string): number | undefined {
  const withUnit = matchQuantity(answer, "months?|mos?", "လ");
  if (withUnit !== undefined) return withUnit;

  // The question asks for a month count, so a bare number is already months.
  const bare = myanmarDigitsToLatin(answer).match(/(\d+(?:\.\d+)?)/);
  return bare ? Number(bare[1]) : undefined;
}

const CATEGORY_LABELS = {
  finance: { en: "Finance", my: "ငွေကြေး" },
  family: { en: "Family", my: "မိသားစု" },
  healthCare: { en: "Health/Care", my: "ကျန်းမာရေး/စောင့်ရှောက်မှု" },
  education: { en: "Education", my: "ပညာရေး" },
  housing: { en: "Housing", my: "နေထိုင်မှု" },
} as const;

export function categoryLabel(
  category: (typeof RISK_CATEGORIES)[number],
  language: SupportedLanguage,
): string {
  return CATEGORY_LABELS[category][language];
}

function explanationFor(
  category: (typeof RISK_CATEGORIES)[number],
  score: number,
  factors: string[],
  language: SupportedLanguage,
): string {
  const label = categoryLabel(category, language);
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
