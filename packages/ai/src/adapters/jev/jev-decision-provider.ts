import { createGateway } from "@ai-sdk/gateway";
import type { NormalizedContent } from "@sloplens/core";
import { type Experimental_EvaluationModel as EvaluationModel, experimental_evaluate } from "ai";

import { AiProviderError } from "../../errors";
import type { DecisionInput, DecisionProvider } from "../../providers/decision";
import { DEFAULT_JEV_MODEL_ID, PROVIDER_IDS } from "../defaults";
import { type JevEvaluationAnswers, mapJevAnswersToContentDecision } from "./map-evaluation";
import { jevContentDecisionQuestions } from "./questions";

export interface JevDecisionProviderConfig {
  apiKey: string;
  modelId?: string;
  threshold?: number;
  evaluate?: typeof experimental_evaluate;
  gatewayFactory?: typeof createGateway;
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

export function createJevDecisionProvider(config: JevDecisionProviderConfig): DecisionProvider {
  const modelId = config.modelId ?? DEFAULT_JEV_MODEL_ID;
  const evaluate = config.evaluate ?? experimental_evaluate;
  const gatewayFactory = config.gatewayFactory ?? createGateway;

  if (!config.apiKey.trim()) {
    throw new AiProviderError(
      "provider_not_configured",
      "Jev decision provider requires an API key",
      {
        capability: "decision",
      },
    );
  }

  const gateway = gatewayFactory({ apiKey: config.apiKey.trim() });
  const evaluationModel: EvaluationModel = gateway.evaluationModel(modelId);

  return {
    providerId: PROVIDER_IDS.decision,
    async analyze(input: DecisionInput) {
      try {
        const result = await evaluate({
          model: evaluationModel,
          state: JSON.stringify(contentToEvaluationState(input.content)),
          questions: jevContentDecisionQuestions,
          providerOptions: {
            gateway: { zeroDataRetention: true },
          },
        });

        return mapJevAnswersToContentDecision(result.answers as JevEvaluationAnswers, {
          threshold: config.threshold,
        });
      } catch (error) {
        if (error instanceof AiProviderError) {
          throw error;
        }
        const message = error instanceof Error ? error.message : "Jev evaluation failed";
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
