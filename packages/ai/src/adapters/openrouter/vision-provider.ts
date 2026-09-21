import type { VisionProvider } from "../../providers/vision";
import { visionResultSchema } from "../../providers/vision";
import { DEFAULT_OPENROUTER_BASE_URL, DEFAULT_VISION_MODEL_ID, PROVIDER_IDS } from "../defaults";
import { type OpenRouterClientConfig, openRouterFetch } from "./client";

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

export interface OpenRouterVisionProviderConfig extends OpenRouterClientConfig {
  modelId?: string;
}

const DEFAULT_VISION_PROMPT =
  "Describe what you see in this image. List any factual claims implied by the image as short bullet phrases.";

export function createOpenRouterVisionProvider(
  config: OpenRouterVisionProviderConfig,
): VisionProvider {
  const modelId = config.modelId ?? DEFAULT_VISION_MODEL_ID;
  const baseUrl = config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL;

  return {
    providerId: PROVIDER_IDS.vision,
    async analyze(input) {
      const prompt = input.prompt ?? DEFAULT_VISION_PROMPT;

      const response = await openRouterFetch<OpenRouterChatResponse>(
        { ...config, baseUrl },
        "/chat/completions",
        {
          capability: "vision",
          method: "POST",
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: input.imageUrl } },
                ],
              },
            ],
          }),
        },
      );

      const text = response.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("OpenRouter vision returned empty content");
      }

      const claims = text
        .split("\n")
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter((line) => line.length > 0);

      return visionResultSchema.parse({
        description: text,
        ...(claims.length > 0 ? { claims } : {}),
        metadata: { modelId },
      });
    },
  };
}
