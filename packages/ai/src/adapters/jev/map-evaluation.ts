import {
  CONTENT_TYPES,
  type ContentDecision,
  type ContentType,
  contentDecisionSchema,
} from "@sloplens/core";

import { DEFAULT_DECISION_BOOLEAN_THRESHOLD } from "../defaults";
import { INFORMATION_QUALITY_LEVELS, ORIGINALITY_LEVELS } from "./questions";

type BooleanAnswer = { type: "boolean"; probability: number };
type ChoiceAnswer = { type: "choice"; choice: string; probabilities: Record<string, number> };
type ScoreAnswer = { type: "score"; score: number; probabilities: Record<string, number> };

export type JevEvaluationAnswers = Record<string, unknown>;

function clampUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function asBooleanAnswer(value: unknown): BooleanAnswer | undefined {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return undefined;
  }
  const answer = value as { type?: string; probability?: number };
  if (answer.type !== "boolean" || typeof answer.probability !== "number") {
    return undefined;
  }
  return { type: "boolean", probability: answer.probability };
}

function asChoiceAnswer(value: unknown): ChoiceAnswer | undefined {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return undefined;
  }
  const answer = value as {
    type?: string;
    choice?: string;
    probabilities?: Record<string, number>;
  };
  if (answer.type !== "choice" || typeof answer.choice !== "string" || !answer.probabilities) {
    return undefined;
  }
  return {
    type: "choice",
    choice: answer.choice,
    probabilities: answer.probabilities,
  };
}

function asScoreAnswer(value: unknown): ScoreAnswer | undefined {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return undefined;
  }
  const answer = value as { type?: string; score?: number; probabilities?: Record<string, number> };
  if (answer.type !== "score" || typeof answer.score !== "number" || !answer.probabilities) {
    return undefined;
  }
  return {
    type: "score",
    score: answer.score,
    probabilities: answer.probabilities,
  };
}

function booleanProbability(answer: BooleanAnswer | undefined): number {
  if (!answer) {
    return 0;
  }
  return clampUnit(answer.probability);
}

function booleanFlag(probability: number, threshold: number): boolean {
  return probability >= threshold;
}

function normalizeScore(answer: ScoreAnswer | undefined, levels: number): number | undefined {
  if (!answer || levels < 2) {
    return undefined;
  }
  return clampUnit(answer.score / (levels - 1));
}

function mapContentType(answer: ChoiceAnswer | undefined): ContentType {
  if (!answer) {
    return "unknown";
  }
  const choice = answer.choice as ContentType;
  if ((CONTENT_TYPES as readonly string[]).includes(choice)) {
    return choice;
  }
  return "unknown";
}

export function mapJevAnswersToContentDecision(
  answers: JevEvaluationAnswers,
  options?: { threshold?: number },
): ContentDecision {
  const threshold = options?.threshold ?? DEFAULT_DECISION_BOOLEAN_THRESHOLD;

  const decision: ContentDecision = {
    aiSlop: booleanProbability(asBooleanAnswer(answers.aiSlop)),
    engagementBait: booleanProbability(asBooleanAnswer(answers.engagementBait)),
    clickbait: booleanProbability(asBooleanAnswer(answers.clickbait)),
    spam: booleanProbability(asBooleanAnswer(answers.spam)),
    advertisement: booleanProbability(asBooleanAnswer(answers.advertisement)),
    containsClaim: booleanFlag(
      booleanProbability(asBooleanAnswer(answers.containsClaim)),
      threshold,
    ),
    needsVerification: booleanFlag(
      booleanProbability(asBooleanAnswer(answers.needsVerification)),
      threshold,
    ),
    needsWebSearch: booleanFlag(
      booleanProbability(asBooleanAnswer(answers.needsWebSearch)),
      threshold,
    ),
    needsImageAnalysis: booleanFlag(
      booleanProbability(asBooleanAnswer(answers.needsImageAnalysis)),
      threshold,
    ),
    needsPowerfulModel: booleanFlag(
      booleanProbability(asBooleanAnswer(answers.needsPowerfulModel)),
      threshold,
    ),
    likelyDuplicate: booleanFlag(
      booleanProbability(asBooleanAnswer(answers.likelyDuplicate)),
      threshold,
    ),
    informationQuality: normalizeScore(
      asScoreAnswer(answers.informationQuality),
      INFORMATION_QUALITY_LEVELS,
    ),
    originality: normalizeScore(asScoreAnswer(answers.originality), ORIGINALITY_LEVELS),
    contentType: mapContentType(asChoiceAnswer(answers.contentType)),
  };

  return contentDecisionSchema.parse(decision);
}
