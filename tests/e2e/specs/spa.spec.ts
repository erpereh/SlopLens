import { expect, openHtmlFixture, test, tweetFixture, youtubeFixture } from "../helpers/extension";
import { overlayHosts, waitForOverlay } from "../helpers/overlay";

test.describe("SPA rerender and hash change", () => {
  test("hash change does not duplicate overlays", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page, 1);

    await page.evaluate(() => {
      (
        window as unknown as { __sloplensFixtures: { changeHash: () => void } }
      ).__sloplensFixtures.changeHash();
    });
    await page.waitForTimeout(300);
    await expect(overlayHosts(page)).toHaveCount(1);
  });

  test("a new tweet article gets its own overlay", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page, 1);

    await page.evaluate(() => {
      (
        window as unknown as { __sloplensFixtures: { addTweet: () => void } }
      ).__sloplensFixtures.addTweet();
    });
    await waitForOverlay(page, 2);
    await expect(page.locator("article[data-testid='tweet']")).toHaveCount(2);
  });

  test("YouTube watch host keeps a single overlay after a client navigation", async ({ page }) => {
    await openHtmlFixture(page, "https://www.youtube.com/watch?v=abc123XYZ", youtubeFixture);
    await waitForOverlay(page, 1);

    await page.evaluate(() => {
      (
        window as unknown as { __sloplensFixtures: { switchVideo: () => void } }
      ).__sloplensFixtures.switchVideo();
    });
    await page.waitForTimeout(500);
    await expect(overlayHosts(page)).toHaveCount(1);
  });
});
