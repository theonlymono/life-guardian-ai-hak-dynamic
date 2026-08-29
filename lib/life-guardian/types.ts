export interface LifeGuardianRequest {
  userId: string;
  message: string;
  locale?: string;
  currency?: string;
  inputMode?: "text" | "voice";
}

export interface LifeGuardianResponse {
  success: boolean;
  conversation?: {
    message: string;
    tone?: string;
    voiceScript?: string;
  };
  lifeEvents?: Array<{ type: string; confidence: number; details?: Record<string, unknown> }>;
  profile?: Record<string, unknown>;
  riskMap?: Array<{
    category: string;
    level: string;
    score: number;
    reason: string;
    evidence?: string[];
  }>;
  priorities?: Array<{ rank: number; category: string; reason: string; priorityScore?: number }>;
  actionPlan?: { next7Days: string[]; next30Days: string[]; next3Years: string[] };
  simulation?: Record<string, unknown> | null;
  missingInformation?: string[];
  followUp?: { required: boolean; days: number; reason: string; message?: string } | null;
  protectionReview?: { recommended: boolean; reason: string; category: string } | null;
  voice?: { enabled: boolean; audioUrl: string | null; mimeType: string | null };
  assessmentQuestions?: string[];
  error?: string;
}
