import type {
  CompletedAction,
  DailyAction,
  LifeContext,
  LifeSummary,
  RiskCategory,
  RiskLevel,
  RiskScore,
  SupportedLanguage,
} from "@/lib/types/life-context";
import type { GoalSimulation } from "@/lib/simulation/goal";

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "AI_NOT_CONFIGURED"
  | "AI_ANALYSIS_FAILED"
  | "INVALID_AI_RESPONSE"
  | "N8N_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface AnalyzeRequest {
  language?: SupportedLanguage;
  input: string;
  existingContext?: LifeContext | null;
}

/**
 * Present on every response that can advance the loop. Once `questionsAnswered`
 * reaches `questionsTotal` the action is null and `summary` carries the
 * closing readout instead.
 */
export interface EngagementProgress {
  questionsAnswered: number;
  questionsTotal: number;
  summary: LifeSummary | null;
  /**
   * Present once the customer has stated a target, a starting amount and a
   * monthly pace for a dated goal. Every figure in it is theirs; the client may
   * re-run it locally to answer "what if I save less".
   */
  simulation: GoalSimulation | null;
}

export interface AnalyzeResponse extends EngagementProgress {
  success: true;
  language: SupportedLanguage;
  context: LifeContext;
  dailyAction: DailyAction | null;
  assistantMessage: string;
  source: "live_ai" | "demo_backup";
}

export interface CompleteActionRequest {
  language?: SupportedLanguage;
  context: LifeContext;
  action: DailyAction;
  answer: string | number | boolean;
}

export interface CompleteActionResponse extends EngagementProgress {
  success: true;
  language: SupportedLanguage;
  updatedContext: LifeContext;
  nextAction: DailyAction | null;
  assistantMessage: string;
  source: "live_ai" | "demo_backup";
}

export interface LifeUpdateRequest {
  language?: SupportedLanguage;
  input: string;
  context: LifeContext;
}

export interface LifeUpdateResponse extends EngagementProgress {
  success: true;
  language: SupportedLanguage;
  updatedContext: LifeContext;
  changesDetected: string[];
  dailyAction: DailyAction | null;
  assistantMessage: string;
  source: "live_ai" | "demo_backup";
}

export interface FollowUpRequest {
  sessionId: string;
  language?: SupportedLanguage;
  context: LifeContext;
  completedAction?: CompletedAction;
  nextAction?: DailyAction;
}

export interface FollowUpResponse {
  success: boolean;
  workflowStatus: "scheduled" | "unavailable";
}

export type ChatTurnKind = "analyze" | "answer" | "update";

export interface ChatRiskMove {
  category: RiskCategory;
  fromScore: number;
  toScore: number;
  fromLevel: RiskLevel;
  toLevel: RiskLevel;
}

export interface ChatLogRequest {
  sessionId: string;
  accountId?: string;
  language?: SupportedLanguage;
  kind: ChatTurnKind;
  userText: string;
  assistantText?: string;
  action?: Pick<DailyAction, "focus" | "question"> & { topicKey?: string };
  risks?: Pick<RiskScore, "category" | "score" | "level">[];
  riskMoves?: ChatRiskMove[];
}

export interface ChatLogResponse {
  success: boolean;
  stored: boolean;
}

export interface HealthResponse {
  status: "ok";
  service: "Life Guardian AI";
  timestamp: string;
  aiConfigured: boolean;
  n8nConfigured: boolean;
  chatLogConfigured: boolean;
  demoBackupMode: boolean;
}
