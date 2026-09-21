import { AiProviderError, isRateLimitedStatus, isRetryableHttpStatus } from "../../errors";
import type { SearchProvider } from "../../providers/search";
import { searchResultSchema } from "../../providers/search";
import { DEFAULT_TAVILY_BASE_URL, PROVIDER_IDS } from "../defaults";

interface TavilySearchResponse {
  results?: Array<{
    url?: string;
    title?: string;
    content?: string;
    published_date?: string;
    score?: number;
  }>;
}

export interface TavilySearchProviderConfig {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createTavilySearchProvider(config: TavilySearchProviderConfig): SearchProvider {
  const baseUrl = config.baseUrl ?? DEFAULT_TAVILY_BASE_URL;

  return {
    providerId: PROVIDER_IDS.search,
    async search(query, options) {
      if (!config.apiKey.trim()) {
        throw new AiProviderError("provider_not_configured", "Tavily API key is not configured", {
          capability: "search",
        });
      }

      const fetchImpl = config.fetchImpl ?? fetch;
      const url = `${baseUrl.replace(/\/$/, "")}/search`;

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: config.apiKey.trim(),
            query,
            max_results: options?.maxResults,
            include_domains: options?.includeDomains,
            exclude_domains: options?.excludeDomains,
            include_answer: false,
            ...(options?.topic ? { topic: options.topic } : {}),
          }),
        });
      } catch (error) {
        throw new AiProviderError("source_unreachable", "Tavily request failed", {
          retryable: true,
          capability: "search",
          cause: error,
        });
      }

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        const message = bodyText
          ? `Tavily error (${response.status}): ${bodyText}`
          : `Tavily error (${response.status})`;
        if (isRateLimitedStatus(response.status)) {
          throw new AiProviderError("rate_limited", message, {
            retryable: true,
            capability: "search",
          });
        }
        throw new AiProviderError(
          isRetryableHttpStatus(response.status) ? "backend_unavailable" : "validation_error",
          message,
          {
            retryable: isRetryableHttpStatus(response.status),
            capability: "search",
          },
        );
      }

      const payload = (await response.json()) as TavilySearchResponse;
      const results = payload.results ?? [];

      return results
        .filter((row) => row.url && row.title)
        .map((row) =>
          searchResultSchema.parse({
            url: row.url as string,
            title: row.title as string,
            ...(row.content ? { snippet: row.content } : {}),
            ...(row.published_date ? { publishedAt: row.published_date } : {}),
            ...(typeof row.score === "number" ? { score: row.score } : {}),
          }),
        );
    },
  };
}
