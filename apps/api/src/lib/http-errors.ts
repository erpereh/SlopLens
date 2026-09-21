import type { ErrorBody } from "@sloplens/shared";
import { createErrorEnvelope } from "@sloplens/shared";

export type ApiHttpStatus = 400 | 500 | 501 | 503;

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

export function notImplemented(message: string): HttpError {
  return new HttpError(501, {
    code: "backend_unavailable",
    message,
    retryable: false,
  });
}
