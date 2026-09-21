import { createErrorEnvelope, SLOPLENS_API_MESSAGE_TYPE } from "@sloplens/shared";
import { describe, expect, it, vi } from "vitest";

import { handleExtensionApiMessage } from "./api-background";

const extensionId = "abcdefghijklmnopqrstuvwxyzabcdef";

describe("handleExtensionApiMessage", () => {
  it("rejects senders that are not this extension", async () => {
    const request = vi.fn();
    const result = await handleExtensionApiMessage({
      message: { type: SLOPLENS_API_MESSAGE_TYPE, operation: "health" },
      sender: { id: "other-extension" },
      extensionId,
      transport: { request },
    });
    expect(request).not.toHaveBeenCalled();
    expect(result.status).toBe(403);
    expect(result.body).toEqual(
      createErrorEnvelope({
        code: "validation_error",
        message: "Untrusted extension message sender",
        retryable: false,
      }),
    );
  });

  it("rejects messages with arbitrary URLs or unknown operations", async () => {
    const request = vi.fn();
    const withUrl = await handleExtensionApiMessage({
      message: {
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "health",
        url: "https://evil.example",
      },
      sender: { id: extensionId },
      extensionId,
      transport: { request },
    });
    expect(request).not.toHaveBeenCalled();
    expect(withUrl.status).toBe(400);

    const unknownOp = await handleExtensionApiMessage({
      message: { type: SLOPLENS_API_MESSAGE_TYPE, operation: "dropTables" },
      sender: { id: extensionId },
      extensionId,
      transport: { request },
    });
    expect(unknownOp.status).toBe(400);
  });

  it("forwards allowlisted operations to the HTTP transport", async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      body: { status: "ok" },
    });
    const result = await handleExtensionApiMessage({
      message: {
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "analyze",
        body: { content: { platform: "x", url: "https://x.com/a", metadata: {} } },
      },
      sender: { id: extensionId },
      extensionId,
      transport: { request },
    });
    expect(request).toHaveBeenCalledWith({
      operation: "analyze",
      body: { content: { platform: "x", url: "https://x.com/a", metadata: {} } },
    });
    expect(result).toEqual({ status: 200, body: { status: "ok" } });
  });
});
