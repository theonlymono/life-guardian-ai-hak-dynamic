import type { RiskCategory, RiskLevel } from "./life-context";

/**
 * The shape of the transcript itself, kept out of the React provider so that
 * storage can persist it without reaching into the component layer.
 */

export type TurnKind = "analyze" | "answer" | "update";

export type StepKey =
  | "stepRead"
  | "stepUnderstand"
  | "stepMerge"
  | "stepRisk"
  | "stepAction";

export interface RiskMove {
  category: RiskCategory;
  fromLevel: RiskLevel;
  toLevel: RiskLevel;
  fromScore: number;
  toScore: number;
}

export interface Turn {
  id: string;
  kind: TurnKind;
  userText: string;
  assistantText: string | null;
  riskMoves: RiskMove[];
  changes: string[];
  pending: boolean;
  failed: boolean;
}
