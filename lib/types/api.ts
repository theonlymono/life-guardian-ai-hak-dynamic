import type {
  CompletedAction,
  DailyAction,
  LifeContext,
  SupportedLanguage,
} from "@/lib/types/life-context";

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "AI_NOT_CONFIGURED"
  | "AI_ANALYSIS_FAILED"
  | "INVALID_AI_RESPONSE"
  | "ELEVENLABS_FAILED"
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

export interface AnalyzeResponse {
  success: true;
  language: SupportedLanguage;
  context: LifeContext;
  dailyAction: DailyAction;
  assistantMessage: string;
  source: "live_ai" | "demo_backup";
}

export interface CompleteActionRequest {
  language?: SupportedLanguage;
  context: LifeContext;
  action: DailyAction;
  answer: string | number | boolean;
}

export interface CompleteActionResponse {
  success: true;
  language: SupportedLanguage;
  updatedContext: LifeContext;
  nextAction: DailyAction;
  assistantMessage: string;
  source: "live_ai" | "demo_backup";
}

export interface LifeUpdateRequest {
  language?: SupportedLanguage;
  input: string;
  context: LifeContext;
}

export interface LifeUpdateResponse {
  success: true;
  language: SupportedLanguage;
  updatedContext: LifeContext;
  changesDetected: string[];
  dailyAction: DailyAction;
  assistantMessage: string;
  source: "live_ai" | "demo_backup";
}

export interface SpeakRequest {
  language?: SupportedLanguage;
  text: string;
}

export interface SpeakSuccessResponse {
  success: true;
  language: SupportedLanguage;
  contentType: "audio/mpeg";
  audioBase64: string;
}

export interface SpeakFallbackResponse {
  success: false;
  fallback: "text";
  message: string;
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

export interface HealthResponse {
  status: "ok";
  service: "Life Guardian AI";
  timestamp: string;
  aiConfigured: boolean;
  elevenLabsConfigured: boolean;
  n8nConfigured: boolean;
  demoBackupMode: boolean;
}
