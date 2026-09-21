import { PROVIDER_CAPABILITIES, type ProviderCapability } from "@sloplens/config/browser";
import { useState } from "react";
import { Button } from "@/components/motion/button/base";
import { Input } from "@/components/motion/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select";
import { useSlopLensI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import type { SettingsCapabilityDraft, SettingsFormValues } from "./types";

export type SettingsFormSubmitPayload = {
  capability: ProviderCapability;
  providerId: string;
  modelId?: string;
  baseUrl?: string;
  /** Only sent when the user typed a new key; never echo stored secrets. */
  apiKey?: string;
};

export function SlopLensSettingsForm({
  initialValues,
  providerOptions,
  onSubmitCapability,
  className,
  lockedCapability,
  hideTitle = false,
}: {
  initialValues: SettingsFormValues;
  providerOptions: Record<ProviderCapability, { id: string; label: string }[]>;
  onSubmitCapability: (payload: SettingsFormSubmitPayload) => Promise<void> | void;
  className?: string;
  lockedCapability?: ProviderCapability;
  hideTitle?: boolean;
}) {
  const { t } = useSlopLensI18n();
  const [activeCapability, setActiveCapability] = useState<ProviderCapability>(
    lockedCapability ?? "decision",
  );
  const [drafts, setDrafts] = useState<SettingsCapabilityDraft[]>(initialValues.capabilities);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = drafts.find((d) => d.capability === activeCapability) ??
    drafts[0] ?? {
      capability: activeCapability,
      selection: {
        capability: activeCapability,
        providerId: "",
      },
    };

  const updateCurrent = (patch: Partial<SettingsCapabilityDraft["selection"]>) => {
    setDrafts((prev) =>
      prev.map((entry) =>
        entry.capability === activeCapability
          ? { ...entry, selection: { ...entry.selection, ...patch } }
          : entry,
      ),
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: SettingsFormSubmitPayload = {
        capability: activeCapability,
        providerId: current.selection.providerId,
        modelId: current.selection.modelId,
        baseUrl: current.selection.baseUrl,
      };
      if (apiKeyInput.trim().length > 0) {
        payload.apiKey = apiKeyInput.trim();
      }
      await onSubmitCapability(payload);
      setApiKeyInput("");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
    >
      {hideTitle ? null : <h2 className="text-lg font-semibold">{t("settings.title")}</h2>}

      {lockedCapability ? null : (
        <div className="space-y-2">
          <span id="sloplens-capability-label" className="text-sm font-medium text-foreground">
            {t("settings.capability")}
          </span>
          <Select
            value={activeCapability}
            onValueChange={(v) => setActiveCapability(v as ProviderCapability)}
          >
            <SelectTrigger aria-labelledby="sloplens-capability-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_CAPABILITIES.map((cap) => (
                <SelectItem key={cap} value={cap}>
                  {cap}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <span id="sloplens-provider-label" className="text-sm font-medium">
          {t("settings.provider")}
        </span>
        <Select
          value={current.selection.providerId}
          onValueChange={(v) => updateCurrent({ providerId: v })}
        >
          <SelectTrigger aria-labelledby="sloplens-provider-label">
            <SelectValue placeholder={t("settings.provider")} />
          </SelectTrigger>
          <SelectContent>
            {(providerOptions[activeCapability] ?? []).map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input
        label={t("settings.model")}
        value={current.selection.modelId ?? ""}
        onChange={(v) => updateCurrent({ modelId: v })}
        autoComplete="off"
      />

      <Input
        label={t("settings.baseUrl")}
        value={current.selection.baseUrl ?? ""}
        onChange={(v) => updateCurrent({ baseUrl: v })}
        autoComplete="off"
        inputMode="url"
      />

      <Input
        label={t("settings.apiKey")}
        type="password"
        value={apiKeyInput}
        onChange={setApiKeyInput}
        placeholder={t("settings.apiKey.placeholder")}
        autoComplete="new-password"
      />
      {current.hasStoredKey ? (
        <p className="text-xs text-muted-foreground">{t("settings.apiKey.stored")}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {t("settings.save")}
        </Button>
        {saved ? (
          <span className="text-sm text-muted-foreground">{t("settings.saved")}</span>
        ) : null}
      </div>
    </form>
  );
}
