import type { ContentDecision, NormalizedContent } from "@sloplens/core";
import type { AnalyzeRequest, AnalyzeResponse, AnalyzeWarning } from "@sloplens/shared";
import type postgres from "postgres";

import { hashNormalizedContent } from "../content-hash";
import { findImageUrl } from "../content-text";
import { findCachedAnalysisByHash, upsertContentAnalysisCache } from "../db/content-cache";
import type { ProviderRuntime } from "./provider-runtime";

const YOUTUBE_VISION_PROMPT =
  "Describe this video thumbnail. Note overlay text, sensational imagery, and whether it looks like clickbait packaging.";

function normalizeDecisionModelId(modelId: string | undefined): string {
  return modelId?.trim() ?? "";
}

export function createAnalyzeService(input: {
  sql: postgres.Sql | null;
  runtime: ProviderRuntime;
}) {
  return {
    async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
      const contentHash = hashNormalizedContent(request.content);
      const { provider: decisionProvider, selection: decisionSelection } =
        await input.runtime.requireDecision();
      const decisionProviderId = decisionSelection.providerId;
      const decisionModelId = normalizeDecisionModelId(decisionSelection.modelId);

      if (!request.forceRefresh && input.sql) {
        const cached = await findCachedAnalysisByHash(
          input.sql,
          contentHash,
          decisionProviderId,
          decisionModelId,
        );
        if (cached) {
          return {
            decision: cached.decision,
            cached: true,
            contentHash,
          };
        }
      }

      let decision = await decisionProvider.analyze({ content: request.content });
      const visionOutcome = await maybeApplyVision(input.runtime, request.content, decision);
      decision = visionOutcome.decision;
      const warnings: AnalyzeWarning[] = visionOutcome.warnings;

      if (input.sql) {
        await upsertContentAnalysisCache({
          sql: input.sql,
          contentHash,
          platform: request.content.platform,
          url: request.content.url,
          externalId: request.content.externalId,
          title: request.content.title,
          body: request.content.text,
          author: request.content.author,
          publishedAt: request.content.publishedAt,
          metadata: request.content.metadata,
          decision,
          decisionProviderId,
          decisionModelId,
        });
      }

      return {
        decision,
        cached: false,
        contentHash,
        ...(warnings.length > 0 ? { warnings } : {}),
      };
    },
  };
}

async function maybeApplyVision(
  runtime: ProviderRuntime,
  content: NormalizedContent,
  decision: ContentDecision,
): Promise<{ decision: ContentDecision; warnings: AnalyzeWarning[] }> {
  const warnings: AnalyzeWarning[] = [];
  const shouldRun = content.platform === "youtube" || decision.needsImageAnalysis;
  if (!shouldRun) {
    return { decision, warnings };
  }

  const imageUrl = findImageUrl(content);
  if (!imageUrl) {
    return { decision, warnings };
  }

  const vision = await runtime.optionalVision();
  if (!vision) {
    return { decision, warnings };
  }

  try {
    const visionResult = await vision.analyze({
      imageUrl,
      prompt: YOUTUBE_VISION_PROMPT,
      content,
    });

    const augmented: NormalizedContent = {
      ...content,
      text: [content.text, `Thumbnail description: ${visionResult.description}`]
        .filter(Boolean)
        .join("\n\n"),
      metadata: {
        ...content.metadata,
        visionApplied: true,
      },
    };

    const { provider: decisionProvider } = await runtime.requireDecision();
    const nextDecision = await decisionProvider.analyze({ content: augmented });
    return { decision: nextDecision, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vision analysis failed";
    warnings.push({ capability: "vision", message });
    return { decision, warnings };
  }
}
