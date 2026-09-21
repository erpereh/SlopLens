import { describe, expect, it, vi } from "vitest";

import { createOpenRouterVisionProvider } from "./vision-provider";

describe("createOpenRouterVisionProvider", () => {
  it("sends image_url content to chat completions", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        choices: [{ message: { content: "- Claim one\nDescription paragraph" } }],
      }),
    );

    const provider = createOpenRouterVisionProvider({
      apiKey: "or-key",
      fetchImpl,
    });

    const result = await provider.analyze({
      imageUrl: "https://example.com/image.jpg",
    });

    expect(result.description).toContain("Description");
    expect(result.claims).toEqual(["Claim one", "Description paragraph"]);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"type":"image_url"'),
      }),
    );
  });
});
