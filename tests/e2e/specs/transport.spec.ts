import { test as base } from "@playwright/test";

import {
  expect,
  launchExtensionContext,
  openHtmlFixture,
  tweetFixture,
} from "../helpers/extension";
import { localhostApiRequests } from "../helpers/mock-api";
import { waitForOverlay } from "../helpers/overlay";

base.describe("MV3 background API proxy", () => {
  base("page never fetches localhost; service worker does", async () => {
    const { context, requests } = await launchExtensionContext();
    const page = context.pages()[0] ?? (await context.newPage());
    try {
      await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
      await waitForOverlay(page);
      await expect(page.getByRole("button", { name: /details/i })).toBeVisible();
      await expect
        .poll(() =>
          localhostApiRequests(requests).filter(
            (item) => item.fromServiceWorker && item.url.endsWith("/analyze"),
          ).length,
        )
        .toBeGreaterThan(0);

      const api = localhostApiRequests(requests);
      const fromPage = api.filter((item) => !item.fromServiceWorker);
      const fromWorker = api.filter((item) => item.fromServiceWorker);

      expect(fromPage, "content script / document must not call localhost").toEqual([]);
      expect(
        fromWorker.some((item) => item.url.endsWith("/analyze") && item.method === "POST"),
      ).toBe(true);
    } finally {
      await context.close();
    }
  });
});
