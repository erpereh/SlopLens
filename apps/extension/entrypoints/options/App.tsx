import { useEffect, useState } from "react";

import { createExtensionApiClient } from "../../lib/api-client";
import { LOCALE_STORAGE_KEY, resolveLocale, translate, type Locale } from "../../lib/i18n";

export function OptionsApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerSummary, setProviderSummary] = useState<string>("");

  useEffect(() => {
    void chrome.storage.local.get([LOCALE_STORAGE_KEY]).then((stored) => {
      setLocale(resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const client = createExtensionApiClient();
        const [settings, providers] = await Promise.all([client.getSettings(), client.getProviders()]);
        if (cancelled) {
          return;
        }
        const selectionCount = settings.selections?.length ?? 0;
        const providerCount = providers.capabilities?.length ?? 0;
        setProviderSummary(
          `${selectionCount} selection(s), ${providerCount} provider definition(s) from API.`,
        );
      } catch {
        if (!cancelled) {
          setError(translate(locale, "optionsLoadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <main className="options">
      <h1>{translate(locale, "optionsTitle")}</h1>
      <p>{translate(locale, "optionsIntro")}</p>

      <section>
        <h2>{translate(locale, "optionsProvidersHeading")}</h2>
        {loading ? <p>{translate(locale, "popupHealthChecking")}</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error ? (
          <p>{providerSummary || translate(locale, "optionsNoProviders")}</p>
        ) : null}
      </section>
    </main>
  );
}
