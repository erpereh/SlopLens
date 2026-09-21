import { PROVIDER_CAPABILITIES, type ProviderCapability } from "@sloplens/config/browser";
import type { ProvidersResponse, SettingsResponse } from "@sloplens/shared";
import {
  type SettingsFormSubmitPayload,
  type SettingsFormValues,
  SlopLensSettingsForm,
  SlopLensUiRoot,
} from "@sloplens/ui";
import { useCallback, useEffect, useState } from "react";

import { createExtensionApiClient } from "../../lib/api-client";
import { LOCALE_STORAGE_KEY, type Locale, resolveLocale } from "../../lib/i18n";
import { readThemePreference, type ThemePreference, writeThemePreference } from "../../lib/theme";

export function OptionsApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
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
  }, []);

  const load = useCallback(async () => {
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
    void load();
  }, [load]);

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
      onThemePreferenceChange={(next) => {
        setThemePreference(next);
        void writeThemePreference(next);
      }}
      className="min-h-screen bg-background p-6"
    >
      <div className="mx-auto w-full max-w-lg">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {!loading && !error && formValues ? (
          <SlopLensSettingsForm
            initialValues={formValues}
            providerOptions={providerOptions}
            onSubmitCapability={onSubmitCapability}
          />
        ) : null}
      </div>
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

function toProviderOptions(
  providers: ProvidersResponse,
): Record<ProviderCapability, { id: string; label: string }[]> {
  const options = emptyProviderOptions();
  for (const group of providers.capabilities) {
    options[group.capability] = group.providers.map((provider) => ({
      id: provider.providerId,
      label: provider.providerId,
    }));
  }
  return options;
}
