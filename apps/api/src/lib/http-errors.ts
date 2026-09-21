import { AiProviderError, EmbeddingDimensionMismatchError } from "@sloplens/ai";
import type { ErrorBody } from "@sloplens/shared";
import { createErrorEnvelope } from "@sloplens/shared";

export type ApiHttpStatus = 400 | 429 | 500 | 501 | 503;

export class HttpError extends Error {
  readonly status: ApiHttpStatus;
  readonly body: ErrorBody;

  constructor(status: ApiHttpStatus, body: ErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }

  toEnvelope() {
    return createErrorEnvelope(this.body);
  }
}

export function validationError(message: string): HttpError {
  return new HttpError(400, {
    code: "validation_error",
    message,
    retryable: false,
  });
}

export function backendUnavailable(message: string, retryable = true): HttpError {
  return new HttpError(503, {
    code: "backend_unavailable",
    message,
    retryable,
  });
}

export function providerNotConfigured(
  capability: ErrorBody["capability"],
  message?: string,
): HttpError {
  return new HttpError(503, {
    code: "provider_not_configured",
    message: message ?? "Provider is not configured",
    retryable: false,
    ...(capability ? { capability } : {}),
  });
}

export function rateLimited(message: string, capability?: ErrorBody["capability"]): HttpError {
  return new HttpError(429, {
    code: "rate_limited",
    message,
    retryable: true,
    ...(capability ? { capability } : {}),
  });
}

export function mapUnknownError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof EmbeddingDimensionMismatchError) {
    return validationError(error.message);
  }

  if (error instanceof AiProviderError) {
    if (error.code === "rate_limited") {
      return rateLimited(error.message, error.capability);
    }
    if (error.code === "provider_not_configured") {
      return providerNotConfigured(error.capability, error.message);
    }
    if (error.code === "validation_error") {
      return validationError(error.message);
    }
    return new HttpError(error.retryable ? 503 : 500, {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.capability ? { capability: error.capability } : {}),
    });
  }

  return new HttpError(500, {
    code: "backend_unavailable",
    message: "Unexpected server error",
    retryable: true,
  });
}
