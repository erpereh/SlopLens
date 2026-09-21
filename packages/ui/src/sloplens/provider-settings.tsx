import type { ProviderCapability } from "@sloplens/config/browser";
import { useState } from "react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { useSlopLensI18n } from "@/i18n/context";
import type { MessageKey } from "@/i18n/messages";
import { type SettingsFormSubmitPayload, SlopLensSettingsForm } from "./settings-form";
import type { SettingsFormValues } from "./types";

const CAPABILITY_KEY: Record<ProviderCapability, MessageKey> = {
  decision: "settings.capability.decision",
  embedding: "settings.capability.embedding",
  search: "settings.capability.search",
  vision: "settings.capability.vision",
  reasoning: "settings.capability.reasoning",
};

export function ProviderSettingsList({
  formValues,
  providerOptions,
  onSubmitCapability,
}: {
  formValues: SettingsFormValues;
  providerOptions: Record<ProviderCapability, { id: string; label: string }[]>;
  onSubmitCapability: (payload: SettingsFormSubmitPayload) => Promise<void> | void;
}) {
  const { t } = useSlopLensI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <BouncyAccordion
      value={openId}
      onValueChange={setOpenId}
      classNames={{ title: "overflow-visible whitespace-normal" }}
      items={formValues.capabilities.map((entry) => {
        const provider = providerOptions[entry.capability]?.find(
          (option) => option.id === entry.selection.providerId,
        );
        const providerLabel =
          provider?.label || entry.selection.providerId || t("popup.notConfigured");
        const model = entry.selection.modelId;
        const open = openId === entry.capability;
        return {
          id: entry.capability,
          title: (
            <span
              className="flex w-full min-w-0 items-center gap-3"
              data-sloplens-provider={entry.capability}
            >
              <span className="w-28 shrink-0">{t(CAPABILITY_KEY[entry.capability])}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-normal text-muted-foreground">
                {providerLabel}
                {model ? ` · ${model}` : ""}
              </span>
              <AnimatedBadge status={entry.hasStoredKey ? "success" : "neutral"} size="sm">
                {entry.hasStoredKey ? t("popup.configured") : t("popup.notConfigured")}
              </AnimatedBadge>
            </span>
          ),
          description: open ? (
            <SlopLensSettingsForm
              key={`${entry.capability}:${entry.selection.providerId}:${entry.hasStoredKey ? "1" : "0"}`}
              initialValues={{ capabilities: [entry] }}
              providerOptions={providerOptions}
              onSubmitCapability={onSubmitCapability}
              lockedCapability={entry.capability}
              hideTitle
            />
          ) : null,
        };
      })}
    />
  );
}
