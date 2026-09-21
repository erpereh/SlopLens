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

  test("navigates X, YouTube and Settings without echoing a stored key", async ({
    context,
    page,
  }) => {
    await openExtensionDashboard(context, page);
    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
    await expect(page.getByText("Jane Doe")).toBeVisible();

    await page.getByRole("button", { name: /^x$/i }).click();
    await expect(page.getByRole("heading", { name: /^x$/i })).toBeVisible();
    await expect(page.getByText("@jane")).toBeVisible();
    await expect(page.getByLabel(/search author or text/i)).toBeVisible();

    await page.getByRole("button", { name: /^youtube$/i }).click();
    await expect(page.getByRole("heading", { name: /youtube/i })).toBeVisible();
    await expect(page.getByText("Stored video")).toBeVisible();
    await expect(page.getByText("@jane")).toHaveCount(0);

    await page.getByRole("button", { name: /^settings$/i }).click();
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^motion$/i })).toBeVisible();
    await expect(page.getByLabel(/api key/i)).toHaveCount(0);
    await page.getByRole("button", { name: /decision/i }).click();
    await expect(page.getByLabel(/api key/i)).toHaveValue("");
    await expect(page.getByText(/a key is stored/i)).toBeVisible();
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
