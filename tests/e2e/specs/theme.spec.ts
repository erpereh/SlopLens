import {
  expect,
  openExtensionPopup,
  openHtmlFixture,
  test,
  tweetFixture,
} from "../helpers/extension";
import { openDetails, overlayHosts, waitForOverlay } from "../helpers/overlay";

test.describe("theme", () => {
  test("cycles light, dark, and system on the overlay surface", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await openDetails(page);

    const root = page.locator("[data-sloplens-root]").first();
    await expect(root).toHaveAttribute("data-theme", "light");

    const toggle = page.getByRole("button", { name: /toggle theme/i }).first();
    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "light");

    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(root).toHaveClass(/dark/);
    await expect
      .poll(async () =>
        overlayHosts(page)
          .first()
          .evaluate((el) => el.classList.contains("dark")),
      )
      .toBe(true);

    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "light");
  });

  test("system preference follows prefers-color-scheme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await openDetails(page);

    const root = page.locator("[data-sloplens-root]").first();
    await expect(root).toHaveAttribute("data-theme", "dark");

    const toggle = page.getByRole("button", { name: /toggle theme/i }).first();
    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "light");
  });

  test("stored reduce motion marks the overlay host even if the OS does not prefer it", async ({
    context,
    page,
  }) => {
    const popup = await context.newPage();
    await openExtensionPopup(context, popup);
    await popup.evaluate(async () => {
      await chrome.storage.local.set({ "sloplens.reducedMotion": "reduce" });
    });

    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);
    await expect
      .poll(async () =>
        overlayHosts(page)
          .first()
          .evaluate((el) => (el as HTMLElement).dataset.reduceMotion === "true"),
      )
      .toBe(true);
    await expect(page.locator("[data-sloplens-root]").first()).toHaveAttribute(
      "data-reduce-motion",
      "true",
    );
  });
});
