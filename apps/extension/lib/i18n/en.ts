export const en = {
  extensionName: "SlopLens",
  overlayBadge: "SlopLens",
  overlayHint: "Analysis UI will open here.",
  popupTitle: "SlopLens",
  popupHealth: "Backend",
  popupHealthOk: "Online",
  popupHealthDown: "Offline",
  popupHealthChecking: "Checking…",
  popupHealthRefresh: "Refresh",
  popupTheme: "Theme",
  popupOpenOptions: "Settings",
  optionsTitle: "SlopLens settings",
  optionsIntro:
    "Provider configuration is stored on the local API. API keys never live in the extension.",
  optionsLoadError: "Could not load settings from the API.",
  optionsProvidersHeading: "Configured providers",
  optionsNoProviders: "No provider metadata returned.",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  language: "Language",
  langEn: "English",
  langEs: "Spanish",
} as const;

export type MessageKey = keyof typeof en;
