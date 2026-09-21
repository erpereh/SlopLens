import {
  expect,
  launchExtensionContext,
  openExtensionDashboard,
  openExtensionPopup,
  test,
} from "../helpers/extension";

test.describe("extension dashboard", () => {
  test("Overview stays up when metrics are unavailable", async () => {
    const { context } = await launchExtensionContext({ apiMode: "metrics-unavailable" });
    const page = context.pages()[0] ?? (await context.newPage());
    try {
      await openExtensionDashboard(context, page);
      await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
      await expect(page.getByText(/unavailable/i).first()).toBeVisible();
      await expect(page.getByLabel(/api key/i)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("navigates Feed, Appearance, and Providers without echoing a stored key", async ({
    context,
    page,
  }) => {
    await openExtensionDashboard(context, page);
    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();

    await page.getByRole("button", { name: /^feed$/i }).click();
    await expect(page.getByRole("heading", { name: /^feed$/i })).toBeVisible();
    await expect(page.getByRole("switch", { name: /auto analyze/i })).toBeVisible();
    await expect(page.getByRole("switch", { name: /dim high-slop/i })).toBeVisible();

    await page.getByRole("button", { name: /^appearance$/i }).click();
    await expect(page.getByRole("heading", { name: /appearance/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^motion$/i })).toBeVisible();

    await page.getByRole("button", { name: /^providers$/i }).click();
    await expect(page.getByRole("heading", { name: /providers/i })).toBeVisible();
    await expect(page.getByPlaceholder(/enter a new key/i).first()).toHaveValue("");
    await expect(page.getByText(/a key is stored/i).first()).toBeVisible();
  });

  test("popup Open Dashboard reaches the options page", async ({ context }) => {
    const popup = await context.newPage();
    await openExtensionPopup(context, popup);
    const [dashboard] = await Promise.all([
      context.waitForEvent("page", {
        predicate: (opened) => opened.url().includes("options.html"),
      }),
      popup.getByRole("button", { name: /open dashboard/i }).click(),
    ]);
    await expect(dashboard.getByRole("heading", { name: /overview/i })).toBeVisible();
  });
});
