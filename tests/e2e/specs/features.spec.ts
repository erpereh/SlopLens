import {
  expect,
  openExtensionPopup,
  openHtmlFixture,
  test,
  tweetFixture,
  youtubeFixture,
} from "../helpers/extension";
import { openDetails, overlayHosts, selectTab, waitForOverlay } from "../helpers/overlay";

test.describe("YouTube watch fixture", () => {
  test("injects one overlay on a watch layout", async ({ page }) => {
    await openHtmlFixture(page, "https://www.youtube.com/watch?v=abc123XYZ", youtubeFixture);
    await waitForOverlay(page);
    await expect(overlayHosts(page)).toHaveCount(1);
    await expect(page.locator("#primary-inner")).toBeVisible();
  });
});

test.describe("feature tabs", () => {
  test("covers Analyze, Verify, and Trace with sources and related nested", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await expect(page.getByRole("button", { name: /slop signal · 82%/i })).toBeVisible();

    await openDetails(page);
    await expect(page.getByRole("tab", { name: "Analyze" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Sources" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Related" })).toHaveCount(0);
    await expect(page.getByText(/news-style content with a verifiable claim/i)).toBeVisible();
    await expect(page.getByText("AI / slop signal").first()).toBeVisible();

    const tabList = page.getByRole("tablist").first();
    await expect
      .poll(async () => tabList.evaluate((node) => node.scrollWidth > node.clientWidth + 1))
      .toBe(false);

    await selectTab(page, "Verify");
    await expect(page.getByText("Backed by sources")).toBeVisible();
    await expect(page.getByText("The claim is backed by the cited note.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Primary research note/i }).first()).toBeVisible();

    await selectTab(page, "Trace");
    await expect(page.getByText("Possible origin")).toBeVisible();
    await expect(page.getByText("Origin article")).toBeVisible();
    await page.getByRole("button", { name: /^related$/i }).click();
    await expect(page.getByRole("link", { name: "Related post" })).toBeVisible();
  });
});

test.describe("slop marker", () => {
  test("applies a decorative SLOP stamp and readable dimming above threshold", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    const tweetText = page.locator('[data-testid="tweetText"]');
    await expect(tweetText).toHaveAttribute("data-sloplens-dimmed", "true");
    await expect(page.locator("[data-sloplens-stamp]")).toHaveCount(1);
    await expect(page.locator("[data-sloplens-stamp]")).toHaveCSS("pointer-events", "none");
    await expect
      .poll(async () => Number(await tweetText.evaluate((node) => getComputedStyle(node).opacity)))
      .toBeGreaterThanOrEqual(0.45);
    await expect
      .poll(async () => Number(await tweetText.evaluate((node) => getComputedStyle(node).opacity)))
      .toBeLessThanOrEqual(0.65);

    await tweetText.hover();
    await expect
      .poll(async () => tweetText.evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
  });

  test("does not stamp or dim when the slop signal is below the threshold", async ({
    context,
    page,
  }) => {
    const popup = await context.newPage();
    await openExtensionPopup(context, popup);
    await popup.evaluate(async () => {
      await chrome.storage.local.set({
        "sloplens.feed": {
          autoAnalyze: true,
          dimHighSlop: true,
          showSlopStamp: true,
          slopThreshold: 0.95,
        },
      });
    });

    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await expect(page.getByRole("button", { name: /slop signal · 82%/i })).toBeVisible();
    await expect(page.locator("[data-sloplens-stamp]")).toHaveCount(0);
    await expect(page.locator("[data-sloplens-dimmed]")).toHaveCount(0);
  });
});
