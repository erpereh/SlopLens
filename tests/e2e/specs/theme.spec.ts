import { expect, openHtmlFixture, test, tweetFixture } from "../helpers/extension";
import { waitForOverlay } from "../helpers/overlay";

test.describe("theme", () => {
  test("cycles light, dark, and system on the overlay surface", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);

    const root = page.locator("[data-sloplens-root]").first();
    await expect(root).toHaveAttribute("data-theme", "light");

    const toggle = page.getByRole("button", { name: /toggle theme/i }).first();
    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "light");

    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(root).toHaveClass(/dark/);

    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "light");
  });

  test("system preference follows prefers-color-scheme", async ({ page }) => {
    await openHtmlFixture(page, "https://x.com/jane/status/1234567890", tweetFixture);
    await waitForOverlay(page);

    const root = page.locator("[data-sloplens-root]").first();
    const toggle = page.getByRole("button", { name: /toggle theme/i }).first();
    // Default stored preference is system; emulate dark.
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-theme", "dark");

    await toggle.click();
    await expect(root).toHaveAttribute("data-theme", "light");
  });
});
