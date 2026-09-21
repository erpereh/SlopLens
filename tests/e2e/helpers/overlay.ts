import type { Locator, Page } from "@playwright/test";

import { expect } from "./extension";

export function overlayHosts(page: Page): Locator {
  return page.locator("sloplens-root");
}

export async function waitForOverlay(page: Page, count = 1): Promise<Locator> {
  await expect(overlayHosts(page)).toHaveCount(count, { timeout: 20_000 });
  return overlayHosts(page);
}

export function inOverlay(page: Page, name: string | RegExp): Locator {
  return page.getByRole("button", { name });
}

export async function openDetails(page: Page): Promise<void> {
  const compact = page.locator("[data-sloplens-compact]");
  const opener = compact.getByRole("button", {
    name: /slop signal|analyzing|details|expand/i,
  });
  await opener.first().click();
  await expect(
    page.locator("[data-sloplens-panel]").getByRole("tab", { name: /analyze/i }),
  ).toBeVisible();
}

export async function closeDetails(page: Page): Promise<void> {
  await page.getByRole("button", { name: /close/i }).first().click();
  await expect(page.getByRole("tab", { name: /analyze/i })).toHaveCount(0);
}

export async function selectTab(page: Page, name: string | RegExp): Promise<void> {
  await page.locator("[data-sloplens-panel]").getByRole("tab", { name }).click();
}
