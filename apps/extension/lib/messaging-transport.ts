import {
  type ApiTransport,
  SLOPLENS_API_MESSAGE_TYPE,
  type SlopLensApiMessage,
  sloplensApiBridgeResponseSchema,
  sloplensApiMessageSchema,
} from "@sloplens/shared";

export function createRuntimeMessagingTransport(
  send: (message: SlopLensApiMessage) => Promise<unknown> = sendViaChromeRuntime,
): ApiTransport {
  return {
    async request(input) {
      const message = sloplensApiMessageSchema.parse({
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: input.operation,
        ...(input.body === undefined ? {} : { body: input.body }),
      });
      const raw = await send(message);
      return sloplensApiBridgeResponseSchema.parse(raw);
    },
  };
}

function sendViaChromeRuntime(message: SlopLensApiMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(response);
    });
  });
}
