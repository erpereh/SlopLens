import { expect, openHtmlFixture, test, tweetFixture, youtubeFixture } from "../helpers/extension";
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
  test("covers Analyze, Verify, Related, and Trace states from the mock API", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await expect(page.getByText(/verifiable claim/i)).toBeVisible();

    await openDetails(page);
    await expect(page.getByText(/news-style content with a verifiable claim/i)).toBeVisible();
    await expect(page.getByText("AI / slop signal").first()).toBeVisible();

    await selectTab(page, "Verify");
    await expect(page.getByText("Backed by sources")).toBeVisible();
    await expect(page.getByText("The claim is backed by the cited note.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Primary research note/i }).first()).toBeVisible();

    await selectTab(page, "Sources");
    await expect(page.getByRole("link", { name: /Primary research note/i }).first()).toBeVisible();

    await selectTab(page, "Related");
    await expect(page.getByRole("link", { name: "Related post" })).toBeVisible();

    await selectTab(page, "Trace");
    await expect(page.getByText("Origin article")).toBeVisible();
    await expect(page.getByText("Candidate origin found via similar embeddings.")).toBeVisible();
  });
});
