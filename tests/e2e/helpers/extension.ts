import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type BrowserContext, test as base, chromium, type Page } from "@playwright/test";

import {
  type ApiMockMode,
  attachRequestAudit,
  type CapturedRequest,
  installApiMock,
} from "./mock-api";

const here = path.dirname(fileURLToPath(import.meta.url));
export const e2eRoot = path.resolve(here, "..");
export const repoRoot = path.resolve(e2eRoot, "../..");
export const tweetFixture = path.join(e2eRoot, "fixtures/tweet.html");
export const youtubeFixture = path.join(e2eRoot, "fixtures/youtube-watch.html");

function builtExtensionPath(): string {
  return path.join(repoRoot, "apps/extension/.output/chrome-mv3");
}

export function resolveExtensionPath(): string {
  const built = builtExtensionPath();
  const manifest = path.join(built, "manifest.json");
  if (!fs.existsSync(manifest)) {
    throw new Error(
      "Extension build missing. Run `pnpm --filter @sloplens/extension build` first.",
    );
  }
  if (!built.includes(" ")) {
    return built;
  }
  const dest = path.join(os.tmpdir(), "sloplens-chrome-mv3");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(built, dest, { recursive: true });
  return dest;
}

export async function launchExtensionContext(options?: {
  apiMode?: ApiMockMode;
}): Promise<{ context: BrowserContext; requests: CapturedRequest[] }> {
  const extensionPath = resolveExtensionPath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sloplens-pw-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    // Headless shell cannot load MV3. --headless=new keeps bundled Chromium
    // (not Chrome stable) while still supporting --load-extension.
    headless: false,
    args: [
      "--headless=new",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    colorScheme: "light",
    viewport: { width: 1280, height: 720 },
  });

  const requests = attachRequestAudit(context);
  await installApiMock(context, options?.apiMode ?? "ok");

  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent("serviceworker", { timeout: 20_000 });
  }
  void worker;

  return { context, requests };
}

export async function openHtmlFixture(page: Page, url: string, fixtureFile: string): Promise<void> {
  const html = fs.readFileSync(fixtureFile, "utf8");
  const origin = new URL(url).origin;
  await page.route(`${origin}/**`, async (route) => {
    if (route.request().resourceType() === "document") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: html,
      });
      return;
    }
    await route.abort();
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
}

type Fixtures = {
  context: BrowserContext;
  page: Page;
};

export const test = base.extend<Fixtures>({
  context: async ({ browserName: _browserName }, use) => {
    const { context } = await launchExtensionContext();
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export async function openExtensionPopup(context: BrowserContext, page: Page): Promise<void> {
  const extensionId = await extensionIdFromContext(context);
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
}

export async function openExtensionDashboard(context: BrowserContext, page: Page): Promise<void> {
  const extensionId = await extensionIdFromContext(context);
  await page.goto(`chrome-extension://${extensionId}/options.html`);
}

async function extensionIdFromContext(context: BrowserContext): Promise<string> {
  let [worker] = context.serviceWorkers();
  if (!worker) {
    worker = await context.waitForEvent("serviceworker", { timeout: 20_000 });
  }
  return new URL(worker.url()).host;
}

export { expect } from "@playwright/test";
