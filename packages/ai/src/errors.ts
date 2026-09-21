import type { ProviderCapability } from "@sloplens/config";
import type { ErrorCode } from "@sloplens/shared";

export class AiProviderError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly capability?: ProviderCapability;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { retryable?: boolean; capability?: ProviderCapability; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AiProviderError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.capability = options?.capability;
  }
}

export function isRateLimitedStatus(status: number): boolean {
  return status === 429;
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
