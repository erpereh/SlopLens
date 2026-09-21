export { AgentProgress } from "./components/agents/loading-states/agent-progress";
export { AnimatedBadge } from "./components/motion/animated-badge";
export { AnimatedToastStack } from "./components/motion/animated-toast-stack";
// Re-export beUI primitives used by extension options / composition
export { BouncyAccordion } from "./components/motion/bouncy-accordion";
export { Button } from "./components/motion/button/base";
export { Loader } from "./components/motion/loader";
export { RangeSlider } from "./components/motion/range-slider";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/motion/select";
export { Switch } from "./components/motion/switch";
export { ThemeToggle } from "./components/motion/theme-toggle";
export { Tooltip } from "./components/motion/tooltip";
export { SlopLensI18nProvider, useSlopLensI18n } from "./i18n/context";
export { type Locale, messages, t } from "./i18n/messages";
export { compactSignalLabel, formatAnalyzeSummary } from "./sloplens/analyze-summary";
export { SlopLensCompactSurface } from "./sloplens/compact-surface";
export { type DashboardSection, SlopLensDashboardApp } from "./sloplens/dashboard-app";
export { DashboardCard } from "./sloplens/dashboard-card";
export { SlopLensDetailPanel } from "./sloplens/detail-panel";
export { FeatureErrorPanel, FeatureStatePanel } from "./sloplens/feature-state";
export type { PopupHealth } from "./sloplens/popup-control";
export { SlopLensPopupControl } from "./sloplens/popup-control";
export {
  ScorePercentSignal,
  ScoreTextSignal,
  scoreToPercent,
  toneFromScore,
} from "./sloplens/score-signal";
export {
  type SettingsFormSubmitPayload,
  SlopLensSettingsForm,
} from "./sloplens/settings-form";
export { SlopLensShell, type SlopLensShellProps } from "./sloplens/sloplens-shell";
export { SlopLensUiRoot } from "./sloplens/sloplens-ui-root";
export { SlopLensThemeToggleButton } from "./sloplens/theme-toggle-button";
export type {
  AnalyzePanelContent,
  CompactSignals,
  FeatureError,
  FeaturePhase,
  FeatureViewState,
  RelatedItem,
  SettingsCapabilityDraft,
  SettingsFormValues,
  SlopLensPanelTab,
  SourceItem,
  TraceOriginCandidate,
  TracePanelContent,
  VerifyPanelContent,
} from "./sloplens/types";
export { MARKED_CONTENT_OPACITY, NARROW_LAYOUT_MAX_WIDTH } from "./sloplens/types";
export { useNarrowLayout } from "./sloplens/use-narrow-layout";
export { SlopLensThemeProvider, useSlopLensTheme } from "./theme/context";
export {
  type MotionPreference,
  type ResolvedTheme,
  resolveReducedMotion,
  resolveTheme,
  type ThemePreference,
} from "./theme/types";
