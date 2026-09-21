import type { ProviderCapability, ProviderSelection } from "@sloplens/config/browser";
import type { ContentDecision } from "@sloplens/core";
import type { ErrorCode } from "@sloplens/shared";

export type SlopLensPanelTab = "analyze" | "verify" | "trace" | "sources" | "related";

export type FeaturePhase = "idle" | "loading" | "success" | "empty" | "error";

export type FeatureError = {
  code: ErrorCode;
  message?: string;
  retryable?: boolean;
};

export type FeatureViewState =
  | { phase: "idle" }
  | { phase: "loading"; labelKey?: string }
  | { phase: "success" }
  | { phase: "empty" }
  | { phase: "error"; error: FeatureError };

export type CompactSignals = {
  decision?: ContentDecision;
  primarySourceLabel?: string | null;
  similarCount?: number | null;
};

export type AnalyzePanelContent = {
  summary?: string;
  decision?: ContentDecision;
};

export type VerifyPanelContent = {
  summary?: string;
  stance?: "supported" | "contradicted" | "mixed" | "unknown" | "unverified";
};

export type TracePanelContent = {
  summary?: string;
  originCandidate?: string;
};

export type SourceItem = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
};

export type RelatedItem = {
  id: string;
  title: string;
  url?: string;
  platform?: string;
};

export type SettingsCapabilityDraft = {
  capability: ProviderCapability;
  selection: ProviderSelection;
  /** True when a key exists server-side; UI never receives the value. */
  hasStoredKey?: boolean;
};

export type SettingsFormValues = {
  capabilities: SettingsCapabilityDraft[];
};

export const NARROW_LAYOUT_MAX_WIDTH = 1024;
