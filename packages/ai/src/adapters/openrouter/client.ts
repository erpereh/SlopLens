import { AiProviderError, isRateLimitedStatus, isRetryableHttpStatus } from "../../errors";
import { DEFAULT_OPENROUTER_BASE_URL } from "../defaults";

export interface OpenRouterClientConfig {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  appReferer?: string;
  appTitle?: string;
}

export interface OpenRouterRequestInit extends RequestInit {
  capability: "embedding" | "vision" | "reasoning";
}

export async function openRouterFetch<T>(
  config: OpenRouterClientConfig,
  path: string,
  init: OpenRouterRequestInit,
): Promise<T> {
  if (!config.apiKey.trim()) {
    throw new AiProviderError("provider_not_configured", "OpenRouter API key is not configured", {
      capability: init.capability,
    });
  }

  const fetchImpl = config.fetchImpl ?? fetch;
  const baseUrl = (config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}${path}`;

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${config.apiKey.trim()}`);
  headers.set("Content-Type", "application/json");
  if (config.appReferer) {
    headers.set("HTTP-Referer", config.appReferer);
  }
  if (config.appTitle) {
    headers.set("X-Title", config.appTitle);
  }

  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, headers });
  } catch (error) {
    throw new AiProviderError("source_unreachable", "OpenRouter request failed", {
      retryable: true,
      capability: init.capability,
      cause: error,
    });
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const message = bodyText
      ? `OpenRouter error (${response.status}): ${bodyText}`
      : `OpenRouter error (${response.status})`;
    if (isRateLimitedStatus(response.status)) {
      throw new AiProviderError("rate_limited", message, {
        retryable: true,
        capability: init.capability,
      });
    }
    throw new AiProviderError(
      isRetryableHttpStatus(response.status) ? "backend_unavailable" : "validation_error",
      message,
      {
        retryable: isRetryableHttpStatus(response.status),
        capability: init.capability,
      },
    );
  }

  return (await response.json()) as T;
}
