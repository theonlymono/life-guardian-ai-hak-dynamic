export type SupportedLanguage = "en" | "my";

export type RiskCategory =
  | "finance"
  | "family"
  | "healthCare"
  | "education"
  | "housing";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncomeStructure = "single_income" | "dual_income" | "unknown";

export type DailyActionType =
  | "text_question"
  | "numeric_input"
  | "multiple_choice"
  | "confirmation";

export interface UserProfile {
  age?: number;
  dependents?: number;
  incomeStructure?: IncomeStructure;
}

export interface LifeEvent {
  id: string;
  type: string;
  description: string;
  timeHorizon?: string;
  evidence: string;
}

export interface FinancialCommitment {
  id: string;
  type: string;
  amount?: number;
  currency?: string;
  description: string;
}

export interface RiskScore {
  category: RiskCategory;
  score: number;
  level: RiskLevel;
  explanation: string;
  contributingFactors: string[];
}

export interface CompletedAction {
  actionId: string;
  focus: string;
  question: string;
  answer: string | number | boolean;
  completedAt: string;
  topicKey?: string;
}

export interface DailyAction {
  id: string;
  focus: string;
  title: string;
  reason: string;
  actionType: DailyActionType;
  question: string;
  options?: string[];
  /**
   * The unit a numeric answer is expected in — "သိန်း", "months", "years".
   * Shown beside the input so a bare "2" cannot be read as the wrong scale.
   */
  unitHint?: string;
  estimatedMinutes: number;
  expectedImpact: string;
  topicKey?: string;
}

/**
 * One thing the customer actually does, with a deadline they can hold
 * themselves to. `basedOn` names the answer it came from, so nothing in the
 * plan can be traced back to a figure the customer never gave us.
 */
export interface LifePlanStep {
  title: string;
  detail: string;
  timeframe: string;
  basedOn: string;
}

/**
 * The readout delivered once the engagement loop stops asking questions.
 * `priorities` is the diagnosis and `plan` is what to do about it.
 * Every field is human-readable and follows the requested language.
 */
export interface LifeSummary {
  headline: string;
  situation: string;
  priorities: { focus: string; why: string }[];
  plan: LifePlanStep[];
  caution: string;
}

export interface LifeContext {
  profile: UserProfile;
  lifeEvents: LifeEvent[];
  commitments: FinancialCommitment[];
  risks: RiskScore[];
  completedActions: CompletedAction[];
  unknownImportantInformation: string[];
  lastUpdatedAt: string;
}

export function emptyLifeContext(now = new Date().toISOString()): LifeContext {
  return {
    profile: {},
    lifeEvents: [],
    commitments: [],
    risks: [],
    completedActions: [],
    unknownImportantInformation: [],
    lastUpdatedAt: now,
  };
}

export function createEntityId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
