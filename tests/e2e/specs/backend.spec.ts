import { test } from "@playwright/test";
import {
  expect,
  launchExtensionContext,
  openHtmlFixture,
  tweetFixture,
} from "../helpers/extension";
import { openDetails, waitForOverlay } from "../helpers/overlay";

test.describe("backend mock and offline UI", () => {
  test("offline API shows a distinct backend error, not an analysis result", async () => {
    const { context } = await launchExtensionContext({ apiMode: "offline" });
    const page = context.pages()[0] ?? (await context.newPage());
    try {
      await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
      await waitForOverlay(page);
      await expect(page.getByRole("alert")).toContainText(/local backend is unreachable/i);
      await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
      await expect(page.getByText(/100%|fake|false/i)).toHaveCount(0);

      await openDetails(page);
      await expect(page.getByRole("alert").first()).toContainText(/local backend is unreachable/i);
    } finally {
      await context.close();
    }
  });

  test("delayed analyze shows a loading state before scores", async () => {
    const { context } = await launchExtensionContext({ apiMode: "delayed-analyze" });
    const page = context.pages()[0] ?? (await context.newPage());
    try {
      await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
      await waitForOverlay(page);
      await expect(page.getByRole("status").first()).toContainText(/analyzing/i);
      await openDetails(page);
      await expect(page.getByText("AI / slop signal").first()).toBeVisible({ timeout: 15_000 });
    } finally {
      await context.close();
    }
  });
});
