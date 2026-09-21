import {
  expect,
  openExtensionPopup,
  openHtmlFixture,
  test,
  tweetFixture,
} from "../helpers/extension";
import { overlayHosts, waitForOverlay } from "../helpers/overlay";

test.describe("popup control center", () => {
  test("stays compact and sends configuration to the dashboard", async ({ context }) => {
    const popup = await context.newPage();
    await openExtensionPopup(context, popup);

    await expect(popup.getByRole("switch", { name: /auto analyze/i })).toBeVisible();
    await expect(popup.getByRole("switch", { name: /dim high-slop/i })).toBeVisible();
    await expect(popup.getByRole("switch", { name: /show slop stamp/i })).toBeVisible();
    await expect(popup.getByText(/slop threshold 70%/i)).toBeVisible();
    await expect(popup.getByRole("button", { name: /open dashboard/i })).toBeVisible();
    await expect(popup.getByText(/^language$/i)).toHaveCount(0);
    await expect(popup.getByPlaceholder(/enter a new key/i)).toHaveCount(0);
    await expect(popup.getByLabel(/api key/i)).toHaveCount(0);
  });

  test("turning Auto Analyze off leaves the feed chip idle", async ({ context, page }) => {
    const popup = await context.newPage();
    await openExtensionPopup(context, popup);
    const autoAnalyze = popup.getByRole("switch", { name: /auto analyze/i });
    await expect(autoAnalyze).toHaveAttribute("aria-checked", "true");
    await autoAnalyze.click();
    await expect(autoAnalyze).toHaveAttribute("aria-checked", "false");

    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await expect(page.getByRole("button", { name: /^analyze$/i })).toBeVisible();
    await expect(overlayHosts(page)).toHaveCount(1);
  });
});
