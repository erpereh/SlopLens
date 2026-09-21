import type { ProviderCapability, ProviderSelection } from "@sloplens/config/browser";
import type { ContentDecision, SlopPresentationSignal } from "@sloplens/core";
import type { ErrorCode } from "@sloplens/shared";

export type SlopLensPanelTab = "analyze" | "verify" | "trace";

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
  slopSignal?: SlopPresentationSignal;
  decision?: ContentDecision;
};

export type AnalyzePanelContent = {
  summary?: string;
  decision?: ContentDecision;
};

export type VerifyPanelContent = {
  summary?: string;
  stance?: "supported" | "contradicted" | "mixed" | "unknown" | "unverified";
  claim?: string;
  sources?: SourceItem[];
  uncertainty?: string;
};

export type TraceOriginCandidate = {
  url: string;
  title?: string;
  publishedAt?: string;
  whyThisMayBeTheOrigin: string;
  confidence: "low" | "medium";
};

export type TracePanelContent = {
  possibleOrigin?: TraceOriginCandidate;
  uncertainty?: string;
  evidence?: Array<{ summary: string; sourceUrl?: string }>;
  related?: RelatedItem[];
  derivatives?: RelatedItem[];
};

export type SourceItem = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  kind?: string;
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

/** Dimmed content stays readable. Tune in-browser inside 0.45–0.65. */
export const MARKED_CONTENT_OPACITY = 0.55;
