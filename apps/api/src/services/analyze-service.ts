import type { ContentDecision, NormalizedContent } from "@sloplens/core";
import type { AnalyzeRequest, AnalyzeResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { hashNormalizedContent } from "../content-hash";
import { findImageUrl } from "../content-text";
import { findCachedAnalysisByHash, upsertContentAnalysisCache } from "../db/content-cache";
import type { ProviderRuntime } from "./provider-runtime";

const YOUTUBE_VISION_PROMPT =
  "Describe this video thumbnail. Note overlay text, sensational imagery, and whether it looks like clickbait packaging.";

export function createAnalyzeService(input: {
  sql: postgres.Sql | null;
  runtime: ProviderRuntime;
}) {
  return {
    async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
      const contentHash = hashNormalizedContent(request.content);

      if (!request.forceRefresh && input.sql) {
        const cached = await findCachedAnalysisByHash(input.sql, contentHash);
        if (cached) {
          return {
            decision: cached.decision,
            cached: true,
            contentHash,
          };
        }
      }

      const decisionProvider = await input.runtime.requireDecision();
      let decision = await decisionProvider.analyze({ content: request.content });
      decision = await maybeApplyVision(input.runtime, request.content, decision);

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
        });
      }

      return {
        decision,
        cached: false,
        contentHash,
      };
    },
  };
}

async function maybeApplyVision(
  runtime: ProviderRuntime,
  content: NormalizedContent,
  decision: ContentDecision,
): Promise<ContentDecision> {
  const shouldRun = content.platform === "youtube" || decision.needsImageAnalysis;
  if (!shouldRun) {
    return decision;
  }

  const imageUrl = findImageUrl(content);
  if (!imageUrl) {
    return decision;
  }

  const vision = await runtime.optionalVision();
  if (!vision) {
    return decision;
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

    const decisionProvider = await runtime.requireDecision();
    return decisionProvider.analyze({ content: augmented });
  } catch {
    return decision;
  }
}
