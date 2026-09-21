import { createTypeSafeAi } from "@ai-sdk/typesafe-ai";
import type { NormalizedContent } from "@sloplens/core";
import { type Experimental_EvaluationModel as EvaluationModel, experimental_evaluate } from "ai";

import { AiProviderError } from "../../errors";
import type { DecisionInput, DecisionProvider } from "../../providers/decision";
import { DEFAULT_DECISION_MODEL_ID, DEFAULT_TYPESAFE_BASE_URL, PROVIDER_IDS } from "../defaults";
import { type JevEvaluationAnswers, mapJevAnswersToContentDecision } from "./map-evaluation";
import { jevContentDecisionQuestions } from "./questions";

export interface TypeSafeDecisionProviderConfig {
  apiKey: string;
  modelId?: string;
  baseUrl?: string;
  threshold?: number;
  evaluate?: typeof experimental_evaluate;
  createClient?: typeof createTypeSafeAi;
}

function contentToEvaluationState(content: NormalizedContent) {
  return {
    platform: content.platform,
    url: content.url,
    author: content.author,
    title: content.title,
    text: content.text,
    publishedAt: content.publishedAt,
    media: content.media,
    metadata: content.metadata,
  };
}

export function createTypeSafeDecisionProvider(
  config: TypeSafeDecisionProviderConfig,
): DecisionProvider {
  const modelId = config.modelId ?? DEFAULT_DECISION_MODEL_ID;
  const evaluate = config.evaluate ?? experimental_evaluate;
  const createClient = config.createClient ?? createTypeSafeAi;

  if (!config.apiKey.trim()) {
    throw new AiProviderError(
      "provider_not_configured",
      "TypeSafe decision provider requires an API key",
      {
        capability: "decision",
      },
    );
  }

  const client = createClient({
    apiKey: config.apiKey.trim(),
    baseURL: config.baseUrl?.trim() || DEFAULT_TYPESAFE_BASE_URL,
  });
  const evaluationModel: EvaluationModel = client.evaluationModel(modelId);

  return {
    providerId: PROVIDER_IDS.decision,
    async analyze(input: DecisionInput) {
      try {
        const result = await evaluate({
          model: evaluationModel,
          state: JSON.stringify(contentToEvaluationState(input.content)),
          questions: jevContentDecisionQuestions,
        });

        return mapJevAnswersToContentDecision(result.answers as JevEvaluationAnswers, {
          threshold: config.threshold,
        });
      } catch (error) {
        if (error instanceof AiProviderError) {
          throw error;
        }
        const message = error instanceof Error ? error.message : "TypeSafe evaluation failed";
        if (/rate limit|429/i.test(message)) {
          throw new AiProviderError("rate_limited", message, {
            retryable: true,
            capability: "decision",
            cause: error,
          });
        }
        throw new AiProviderError("backend_unavailable", message, {
          retryable: true,
          capability: "decision",
          cause: error,
        });
      }
    },
  };
}
