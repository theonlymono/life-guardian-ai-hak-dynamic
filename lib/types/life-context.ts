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
  estimatedMinutes: number;
  expectedImpact: string;
  topicKey?: string;
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
