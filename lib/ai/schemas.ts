import { z } from "zod";

export const supportedLanguageSchema = z.enum(["en", "my"]);

export const riskCategorySchema = z.enum([
  "finance",
  "family",
  "healthCare",
  "education",
  "housing",
]);

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const incomeStructureSchema = z.enum([
  "single_income",
  "dual_income",
  "unknown",
]);

export const dailyActionTypeSchema = z.enum([
  "text_question",
  "numeric_input",
  "multiple_choice",
  "confirmation",
]);

export const userProfileSchema = z.object({
  age: z.number().int().min(0).max(120).optional(),
  dependents: z.number().int().min(0).max(20).optional(),
  incomeStructure: incomeStructureSchema.optional(),
});

export const lifeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  timeHorizon: z.string().optional(),
  evidence: z.string().min(1),
});

export const financialCommitmentSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(1).max(8).optional(),
  description: z.string().min(1),
});

export const riskScoreSchema = z.object({
  category: riskCategorySchema,
  score: z.number().min(0).max(100),
  level: riskLevelSchema,
  explanation: z.string().min(1),
  contributingFactors: z.array(z.string()).default([]),
});

export const completedActionSchema = z.object({
  actionId: z.string().min(1),
  focus: z.string().min(1),
  question: z.string().min(1),
  answer: z.union([z.string(), z.number(), z.boolean()]),
  completedAt: z.string().min(1),
  topicKey: z.string().optional(),
});

export const dailyActionSchema = z.object({
  id: z.string().min(1),
  focus: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  actionType: dailyActionTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  estimatedMinutes: z.number().min(1).max(10),
  expectedImpact: z.string().min(1),
  topicKey: z.string().optional(),
});

export const lifeContextSchema = z.object({
  profile: userProfileSchema.default({}),
  lifeEvents: z.array(lifeEventSchema).default([]),
  commitments: z.array(financialCommitmentSchema).default([]),
  risks: z.array(riskScoreSchema).default([]),
  completedActions: z.array(completedActionSchema).default([]),
  unknownImportantInformation: z.array(z.string()).default([]),
  lastUpdatedAt: z.string().min(1),
});

export const extractedEventSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  timeHorizon: z.string().optional(),
  evidence: z.string().min(1),
});

export const extractedCommitmentSchema = z.object({
  type: z.string().min(1),
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(1).max(8).optional(),
  description: z.string().min(1),
});

export const extractionResultSchema = z.object({
  profile: userProfileSchema.default({}),
  lifeEvents: z.array(extractedEventSchema).default([]),
  commitments: z.array(extractedCommitmentSchema).default([]),
  unknownImportantInformation: z.array(z.string()).default([]),
  insufficientInformation: z.boolean().default(false),
  summary: z.string().optional(),
});

export const dailyActionDraftSchema = z.object({
  focus: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  actionType: dailyActionTypeSchema.default("text_question"),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  estimatedMinutes: z.number().min(1).max(10).default(2),
  expectedImpact: z.string().min(1),
  topicKey: z.string().min(1),
  assistantMessage: z.string().min(1),
});

export const answerInterpretationSchema = z.object({
  interpretedAnswer: z.union([z.string(), z.number(), z.boolean()]),
  profileUpdates: userProfileSchema.default({}),
  newLifeEvents: z.array(extractedEventSchema).default([]),
  newCommitments: z.array(extractedCommitmentSchema).default([]),
  resolvedUnknowns: z.array(z.string()).default([]),
  newlyUnknown: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const analyzeRequestSchema = z.object({
  language: supportedLanguageSchema.optional(),
  input: z.string().trim().min(1).max(8000),
  existingContext: lifeContextSchema.nullable().optional(),
});

export const completeActionRequestSchema = z.object({
  language: supportedLanguageSchema.optional(),
  context: lifeContextSchema,
  action: dailyActionSchema,
  answer: z.union([z.string(), z.number(), z.boolean()]),
});

export const lifeUpdateRequestSchema = z.object({
  language: supportedLanguageSchema.optional(),
  input: z.string().trim().min(1).max(8000),
  context: lifeContextSchema,
});

export const followUpRequestSchema = z.object({
  sessionId: z.string().trim().min(1).max(200),
  language: supportedLanguageSchema.optional(),
  context: lifeContextSchema,
  completedAction: completedActionSchema.optional(),
  nextAction: dailyActionSchema.optional(),
});

export const lifeSummarySchema = z.object({
  headline: z.string().min(1).max(300),
  situation: z.string().min(1).max(2000),
  priorities: z
    .array(
      z.object({
        focus: z.string().min(1).max(200),
        why: z.string().min(1).max(800),
      }),
    )
    .min(1)
    .max(4),
  plan: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        detail: z.string().min(1).max(800),
        timeframe: z.string().min(1).max(120),
        basedOn: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(4),
  caution: z.string().min(1).max(1000),
});

export const chatLogRequestSchema = z.object({
  sessionId: z.string().trim().min(1).max(200),
  language: supportedLanguageSchema.optional(),
  kind: z.enum(["analyze", "answer", "update"]),
  userText: z.string().max(8000).default(""),
  assistantText: z.string().max(8000).optional(),
  action: z
    .object({
      focus: z.string().max(200),
      question: z.string().max(2000),
      topicKey: z.string().max(200).optional(),
    })
    .optional(),
  risks: z
    .array(
      z.object({
        category: riskCategorySchema,
        score: z.number().min(0).max(100),
        level: riskLevelSchema,
      }),
    )
    .default([]),
  riskMoves: z
    .array(
      z.object({
        category: riskCategorySchema,
        fromScore: z.number(),
        toScore: z.number(),
        fromLevel: riskLevelSchema,
        toLevel: riskLevelSchema,
      }),
    )
    .default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type DailyActionDraft = z.infer<typeof dailyActionDraftSchema>;
export type AnswerInterpretation = z.infer<typeof answerInterpretationSchema>;
