export const DASHBOARD_SECTION_STORAGE_KEY = "sloplens.dashboardSection";

export type DashboardSection = "overview" | "x" | "youtube" | "settings";

const SECTIONS: ReadonlySet<string> = new Set(["overview", "x", "youtube", "settings"]);

export function parseDashboardSection(value: unknown): DashboardSection {
  if (value === "providers" || value === "appearance") {
    return "settings";
  }
  if (typeof value === "string" && SECTIONS.has(value)) {
    return value as DashboardSection;
  }
  return "overview";
}

export async function readDashboardSection(): Promise<DashboardSection> {
  const stored = await chrome.storage.local.get(DASHBOARD_SECTION_STORAGE_KEY);
  return parseDashboardSection(stored[DASHBOARD_SECTION_STORAGE_KEY]);
}

export async function writeDashboardSection(section: DashboardSection): Promise<void> {
  await chrome.storage.local.set({ [DASHBOARD_SECTION_STORAGE_KEY]: section });
}
