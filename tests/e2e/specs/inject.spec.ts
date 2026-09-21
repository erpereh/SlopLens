import { expect, openHtmlFixture, test, tweetFixture } from "../helpers/extension";
import { closeDetails, openDetails, overlayHosts, waitForOverlay } from "../helpers/overlay";

test.describe("extension injection", () => {
  test("injects a single Shadow DOM overlay on a tweet fixture", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    const hosts = await waitForOverlay(page);
    await expect(hosts).toHaveCount(1);

    const host = hosts.first();
    await expect.poll(async () => host.evaluate((el) => Boolean(el.shadowRoot))).toBe(true);

    await expect(page.getByRole("button", { name: /slop signal/i })).toBeVisible();
    await expect(page.getByText(/^slop$/i).first()).toBeVisible();
    await expect(page.locator("[data-sloplens-stamp]")).toHaveCount(1);
  });

  test("opens and closes the detail panel without duplicating overlays", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);

    await openDetails(page);
    await expect(overlayHosts(page)).toHaveCount(1);
    await expect(page.getByRole("tab", { name: "Verify" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Trace" })).toBeVisible();

    await closeDetails(page);
    await expect(page.getByRole("button", { name: /slop signal/i })).toBeVisible();
    await expect(overlayHosts(page)).toHaveCount(1);
  });

  test("opens an anchored panel on a 1024px viewport without moving the tweet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    const tweet = page.locator('[data-testid="tweet"]');
    const before = await tweet.boundingBox();
    await openDetails(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: /slop signal/i })).toBeVisible();
    await expect(overlayHosts(page)).toHaveCount(1);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    const after = await tweet.boundingBox();
    expect(after?.y).toBe(before?.y);
    expect(after?.height).toBe(before?.height);
    const panelInBody = await page.evaluate(() =>
      Boolean(document.body.querySelector("[data-sloplens-panel]")),
    );
    expect(panelInBody).toBe(false);
  });
});
