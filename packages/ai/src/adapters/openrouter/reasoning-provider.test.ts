import { describe, expect, it, vi } from "vitest";

import { createOpenRouterReasoningProvider } from "./reasoning-provider";

describe("createOpenRouterReasoningProvider", () => {
  it("returns chat completion text", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        choices: [{ message: { content: "Reasoned answer" } }],
      }),
    );

    const provider = createOpenRouterReasoningProvider({
      apiKey: "or-key",
      fetchImpl,
    });

    const result = await provider.complete({
      prompt: "Summarize the claim",
      context: "Background",
    });

    expect(result.text).toBe("Reasoned answer");
  });
});
