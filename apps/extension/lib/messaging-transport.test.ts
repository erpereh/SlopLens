import {
  createSlopLensApiClient,
  SLOPLENS_API_MESSAGE_TYPE,
  type SlopLensApiMessage,
} from "@sloplens/shared";
import { describe, expect, it, vi } from "vitest";

import { createRuntimeMessagingTransport } from "./messaging-transport";

describe("createRuntimeMessagingTransport", () => {
  it("sends a closed operation message and never a URL", async () => {
    const send = vi.fn(async (message: SlopLensApiMessage) => {
      expect(message).toEqual({
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "health",
      });
      expect(message).not.toHaveProperty("url");
      return { status: 200, body: { status: "ok" } };
    });
    const client = createSlopLensApiClient({
      transport: createRuntimeMessagingTransport(send),
    });
    await expect(client.health()).resolves.toEqual({ status: "ok" });
    expect(send).toHaveBeenCalledOnce();
  });
});
