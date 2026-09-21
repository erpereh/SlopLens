import fs from "node:fs";
import path from "node:path";

import { test as base } from "@playwright/test";

import {
  expect,
  launchExtensionContext,
  openHtmlFixture,
  resolveExtensionPath,
  tweetFixture,
} from "../helpers/extension";
import { waitForOverlay } from "../helpers/overlay";

const SECRET_PATTERNS = [
  "OPENROUTER_API_KEY",
  "AI_GATEWAY_API_KEY",
  "TAVILY_API_KEY",
  "DATABASE_URL",
  "sk-or-",
  "tvly-",
];

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (/\.(js|css|json|html|txt|map)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

base.describe("secrets stay out of the extension", () => {
  base("built chrome-mv3 bundle does not contain provider secrets", () => {
    const root = resolveExtensionPath();
    const files = walkFiles(root);
    expect(files.length).toBeGreaterThan(0);

    const hits: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      for (const pattern of SECRET_PATTERNS) {
        if (text.includes(pattern)) {
          hits.push(`${path.relative(root, file)}:${pattern}`);
        }
      }
    }
    expect(hits, "forbidden secret patterns in the extension bundle").toEqual([]);
  });

  base("frontend requests to the mock API do not send keys", async () => {
    const { context, requests } = await launchExtensionContext();
    const page = context.pages()[0] ?? (await context.newPage());
    try {
      await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
      await waitForOverlay(page);
      await page.getByRole("button", { name: /details/i }).click();
      await page.getByRole("tab", { name: "Verify" }).click();
      await expect(page.getByText("Backed by sources")).toBeVisible();

      const apiRequests = requests.filter((item) => item.url.startsWith("http://127.0.0.1:3001/"));
      expect(apiRequests.length).toBeGreaterThan(0);

      for (const item of apiRequests) {
        expect(item.headers.authorization ?? "").toBe("");
        expect(item.headers["x-api-key"] ?? "").toBe("");
        const body = item.postData ?? "";
        expect(body).not.toMatch(
          /OPENROUTER_API_KEY|AI_GATEWAY_API_KEY|TAVILY_API_KEY|sk-or-|tvly-/,
        );
        expect(body).not.toMatch(/"apiKey"\s*:/);
      }
    } finally {
      await context.close();
    }
  });
});
