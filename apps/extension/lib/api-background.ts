import {
  type ApiTransport,
  createErrorEnvelope,
  type SlopLensApiBridgeResponse,
  sloplensApiMessageSchema,
} from "@sloplens/shared";

export interface ApiMessageSender {
  id?: string;
}

export async function handleExtensionApiMessage(input: {
  message: unknown;
  sender: ApiMessageSender;
  extensionId: string;
  transport: ApiTransport;
}): Promise<SlopLensApiBridgeResponse> {
  if (!input.sender.id || input.sender.id !== input.extensionId) {
    return {
      status: 403,
      body: createErrorEnvelope({
        code: "validation_error",
        message: "Untrusted extension message sender",
        retryable: false,
      }),
    };
  }

  const parsed = sloplensApiMessageSchema.safeParse(input.message);
  if (!parsed.success) {
    return {
      status: 400,
      body: createErrorEnvelope({
        code: "validation_error",
        message: "Unknown SlopLens API operation",
        retryable: false,
      }),
    };
  }

  try {
    return await input.transport.request({
      operation: parsed.data.operation,
      body: parsed.data.body,
    });
  } catch {
    return {
      status: 503,
      body: createErrorEnvelope({
        code: "backend_unavailable",
        message: "Local backend is unreachable",
        retryable: true,
      }),
    };
  }
}
