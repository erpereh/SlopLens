import type { ReasoningProvider } from "../../providers/reasoning";
import { reasoningResultSchema } from "../../providers/reasoning";
import { DEFAULT_OPENROUTER_BASE_URL, DEFAULT_REASONING_MODEL_ID, PROVIDER_IDS } from "../defaults";
import { type OpenRouterClientConfig, openRouterFetch } from "./client";

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

export interface OpenRouterReasoningProviderConfig extends OpenRouterClientConfig {
  modelId?: string;
}

export function createOpenRouterReasoningProvider(
  config: OpenRouterReasoningProviderConfig,
): ReasoningProvider {
  const modelId = config.modelId ?? DEFAULT_REASONING_MODEL_ID;
  const baseUrl = config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL;

  return {
    providerId: PROVIDER_IDS.reasoning,
    async complete(input) {
      const userContent = input.context ? `${input.context}\n\n${input.prompt}` : input.prompt;

      const response = await openRouterFetch<OpenRouterChatResponse>(
        { ...config, baseUrl },
        "/chat/completions",
        {
          capability: "reasoning",
          method: "POST",
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: userContent }],
          }),
        },
      );

      const text = response.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("OpenRouter reasoning returned empty content");
      }

      return reasoningResultSchema.parse({ text, metadata: { modelId } });
    },
  };
}
