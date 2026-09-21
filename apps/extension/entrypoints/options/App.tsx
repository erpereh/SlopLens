import { PROVIDER_CAPABILITIES, type ProviderCapability } from "@sloplens/config/browser";
import type {
  HealthResponse,
  MetricsResponse,
  ProvidersResponse,
  SettingsResponse,
} from "@sloplens/shared";
import {
  type DashboardSection,
  type SettingsFormSubmitPayload,
  type SettingsFormValues,
  SlopLensDashboardApp,
  SlopLensUiRoot,
} from "@sloplens/ui";
import { useCallback, useEffect, useState } from "react";

import { createExtensionApiClient } from "../../lib/api-client";
import {
  DASHBOARD_SECTION_STORAGE_KEY,
  parseDashboardSection,
  readDashboardSection,
  writeDashboardSection,
} from "../../lib/dashboard";
import {
  DEFAULT_FEED_PREFERENCES,
  type FeedPreferences,
  readFeedPreferences,
  writeFeedPreferences,
} from "../../lib/feed-preferences";
import { LOCALE_STORAGE_KEY, type Locale, resolveLocale } from "../../lib/i18n";
import {
  type MotionPreference,
  readMotionPreference,
  readThemePreference,
  type ThemePreference,
  writeMotionPreference,
  writeThemePreference,
} from "../../lib/theme";

const unavailableMetrics: MetricsResponse = {
  status: "unavailable",
  checks: { database: false, pgvector: false },
  counts: {
    contentItems: null,
    cachedAnalyses: null,
    clusters: null,
    relations: null,
  },
  lastActivityAt: null,
};

export function OptionsApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [motionPreference, setMotionPreference] = useState<MotionPreference>("system");
  const [section, setSection] = useState<DashboardSection>("overview");
  const [version, setVersion] = useState("0.0.0");
  const [health, setHealth] = useState<HealthResponse["status"] | "checking">("checking");
  const [metrics, setMetrics] = useState<MetricsResponse | null>(unavailableMetrics);
  const [feed, setFeed] = useState<FeedPreferences>(DEFAULT_FEED_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SettingsFormValues | null>(null);
  const [providerOptions, setProviderOptions] = useState<
    Record<ProviderCapability, { id: string; label: string }[]>
  >(emptyProviderOptions());

  useEffect(() => {
    void chrome.storage.local.get([LOCALE_STORAGE_KEY]).then((stored) => {
      setLocale(resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined));
    });
    void readThemePreference().then(setThemePreference);
    void readMotionPreference().then(setMotionPreference);
    void readFeedPreferences().then(setFeed);
    void readDashboardSection().then(setSection);
    setVersion(chrome.runtime.getManifest().version);
  }, []);

  useEffect(() => {
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !changes[DASHBOARD_SECTION_STORAGE_KEY]) {
        return;
      }
      setSection(parseDashboardSection(changes[DASHBOARD_SECTION_STORAGE_KEY].newValue));
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const loadHealthAndMetrics = useCallback(async () => {
    const client = createExtensionApiClient();
    try {
      const nextHealth = await client.health();
      setHealth(nextHealth.status);
    } catch {
      setHealth("unavailable");
    }
    try {
      setMetrics(await client.metrics());
    } catch {
      setMetrics(unavailableMetrics);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = createExtensionApiClient();
      const [settings, providers] = await Promise.all([
        client.getSettings(),
        client.getProviders(),
      ]);
      setFormValues(toFormValues(settings));
      setProviderOptions(toProviderOptions(providers));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealthAndMetrics();
    void loadSettings();
  }, [loadHealthAndMetrics, loadSettings]);

  const onSubmitCapability = async (payload: SettingsFormSubmitPayload) => {
    const client = createExtensionApiClient();
    const next = await client.putProviderSelections({
      selections: [
        {
          capability: payload.capability,
          providerId: payload.providerId,
          ...(payload.modelId ? { modelId: payload.modelId } : {}),
          ...(payload.baseUrl ? { baseUrl: payload.baseUrl } : {}),
        },
      ],
      ...(payload.apiKey
        ? {
            secrets: [
              {
                capability: payload.capability,
                providerId: payload.providerId,
                apiKey: payload.apiKey,
              },
            ],
          }
        : {}),
    });
    setFormValues(toFormValues(next));
  };

  return (
    <SlopLensUiRoot
      locale={locale}
      themePreference={themePreference}
      motionPreference={motionPreference}
      onThemePreferenceChange={(next) => {
        setThemePreference(next);
        void writeThemePreference(next);
      }}
      onMotionPreferenceChange={(next) => {
        setMotionPreference(next);
        void writeMotionPreference(next);
      }}
      className="min-h-svh bg-background"
    >
      <SlopLensDashboardApp
        section={section}
        onSectionChange={(next) => {
          setSection(next);
          void writeDashboardSection(next);
        }}
        version={version}
        health={health}
        metrics={metrics}
        feed={feed}
        onFeedChange={(next) => {
          setFeed(next);
          void writeFeedPreferences(next);
        }}
        locale={locale}
        onLocaleChange={async (next) => {
          setLocale(next);
          await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: next });
        }}
        motionPreference={motionPreference}
        onMotionPreferenceChange={(next) => {
          setMotionPreference(next);
          void writeMotionPreference(next);
        }}
        formValues={formValues}
        providerOptions={providerOptions}
        onSubmitCapability={onSubmitCapability}
        settingsLoading={loading}
        settingsError={error}
        onTestHealth={() => void loadHealthAndMetrics()}
      />
    </SlopLensUiRoot>
  );
}

function emptyProviderOptions(): Record<ProviderCapability, { id: string; label: string }[]> {
  return {
    decision: [],
    embedding: [],
    search: [],
    vision: [],
    reasoning: [],
  };
}

function toFormValues(settings: SettingsResponse): SettingsFormValues {
  const secretByCapability = new Map(
    settings.secrets.map((secret) => [
      `${secret.capability}:${secret.providerId}`,
      secret.configured,
    ]),
  );
  const capabilities = PROVIDER_CAPABILITIES.map((capability) => {
    const selection = settings.selections.find((item) => item.capability === capability) ?? {
      capability,
      providerId: "",
    };
    return {
      capability,
      selection,
      hasStoredKey:
        secretByCapability.get(`${selection.capability}:${selection.providerId}`) === true,
    };
  });
  return { capabilities };
}

function providerLabel(providerId: string): string {
  if (providerId === "typesafe") {
    return "TypeSafe";
  }
  return providerId;
}

function toProviderOptions(
  providers: ProvidersResponse,
): Record<ProviderCapability, { id: string; label: string }[]> {
  const options = emptyProviderOptions();
  for (const group of providers.capabilities) {
    options[group.capability] = group.providers.map((provider) => ({
      id: provider.providerId,
      label: providerLabel(provider.providerId),
    }));
  }
  return options;
}
