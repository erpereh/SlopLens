export const API_ROUTES = {
  health: "/health",
  metrics: "/metrics",
  providers: "/providers",
  settings: "/settings",
  settingsProviders: "/settings/providers",
  analyze: "/analyze",
  verify: "/verify",
  trace: "/trace",
  related: "/related",
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
