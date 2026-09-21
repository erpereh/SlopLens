export async function openDashboardPage(): Promise<void> {
  const url = chrome.runtime.getURL("options.html");
  if (chrome.tabs?.create) {
    await chrome.tabs.create({ url });
    return;
  }
  await chrome.runtime.openOptionsPage();
}
