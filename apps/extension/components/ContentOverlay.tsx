import type { ContentDecision, NormalizedContent } from "@sloplens/core";
import { SlopLensApiError } from "@sloplens/shared";
import {
  type FeatureViewState,
  type RelatedItem,
  type SlopLensPanelTab,
  SlopLensShell,
  SlopLensUiRoot,
  type SourceItem,
  type TracePanelContent,
  type VerifyPanelContent,
  formatAnalyzeSummary,
} from "@sloplens/ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createExtensionApiClient } from "../lib/api-client";
import { toFeatureError } from "../lib/feature-error";
import type { Locale } from "../lib/i18n";
import type { ThemePreference } from "../lib/theme";

export interface ContentOverlayProps {
  content: NormalizedContent;
  locale: Locale;
  themePreference: ThemePreference;
  onThemePreferenceChange: (next: ThemePreference) => void;
  reducedMotion: boolean;
}

const idle: FeatureViewState = { phase: "idle" };

export function ContentOverlay({
  content,
  locale,
  themePreference,
  onThemePreferenceChange,
  reducedMotion: _reducedMotion,
}: ContentOverlayProps) {
  const client = useMemo(() => createExtensionApiClient(), []);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tab, setTab] = useState<SlopLensPanelTab>("analyze");
  const [analyzeState, setAnalyzeState] = useState<FeatureViewState>({ phase: "loading" });
  const [verifyState, setVerifyState] = useState<FeatureViewState>(idle);
  const [traceState, setTraceState] = useState<FeatureViewState>(idle);
  const [relatedState, setRelatedState] = useState<FeatureViewState>(idle);
  const [sourcesState, setSourcesState] = useState<FeatureViewState>(idle);
  const [decision, setDecision] = useState<ContentDecision>();
  const [verify, setVerify] = useState<VerifyPanelContent>();
  const [trace, setTrace] = useState<TracePanelContent>();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [similarCount, setSimilarCount] = useState<number | null>();
  const [primarySourceLabel, setPrimarySourceLabel] = useState<string | null>();

  const runAnalyze = useCallback(async () => {
    setAnalyzeState({ phase: "loading" });
    try {
      const result = await client.analyze({ content });
      setDecision(result.decision);
      setAnalyzeState({ phase: "success" });
    } catch (error) {
      setAnalyzeState({ phase: "error", error: toFeatureError(error) });
    }
  }, [client, content]);

  const runVerify = useCallback(async () => {
    setVerifyState({ phase: "loading" });
    setSourcesState({ phase: "loading" });
    try {
      const claim = claimFromContent(content);
      const result = await client.verify({ claim, content });
      const empty = result.status === "insufficient_evidence" && result.sources.length === 0;
      setVerify({
        summary: empty ? undefined : (result.evidence[0]?.summary ?? result.sources[0]?.title),
        stance: stanceFromEvidence(result.evidence.map((item) => item.stance)),
      });
      const nextSources = result.sources.map((source, index) => ({
        id: source.url || String(index),
        title: source.title ?? source.url,
        url: source.url,
      }));
      setSources(nextSources);
      setPrimarySourceLabel(nextSources[0]?.title ?? null);
      setVerifyState(empty ? { phase: "empty" } : { phase: "success" });
      setSourcesState(nextSources.length > 0 ? { phase: "success" } : { phase: "empty" });
    } catch (error) {
      const mapped = toFeatureError(error);
      setVerifyState({ phase: "error", error: mapped });
      setSourcesState({ phase: "error", error: mapped });
    }
  }, [client, content]);

  const runTrace = useCallback(async () => {
    setTraceState({ phase: "loading" });
    try {
      const result = await client.trace({ content });
      if (result.status === "insufficient_evidence") {
        setTrace(undefined);
        setTraceState({ phase: "empty" });
        return;
      }
      setTrace({
        summary: result.evidence[0]?.summary ?? result.graph.origin?.title,
        originCandidate: result.graph.origin?.title ?? result.graph.origin?.url,
      });
      setTraceState({ phase: "success" });
    } catch (error) {
      setTraceState({ phase: "error", error: toFeatureError(error) });
    }
  }, [client, content]);

  const runRelated = useCallback(async () => {
    setRelatedState({ phase: "loading" });
    try {
      const result = await client.related({ content });
      const items = result.items.map((item, index) => ({
        id: item.url || String(index),
        title: item.title ?? item.url,
        url: item.url,
        platform: item.platform,
      }));
      setRelated(items);
      setSimilarCount(items.length);
      setRelatedState(items.length > 0 ? { phase: "success" } : { phase: "empty" });
    } catch (error) {
      if (error instanceof SlopLensApiError && error.code === "backend_unavailable") {
        setRelatedState({ phase: "error", error: toFeatureError(error) });
        return;
      }
      setRelatedState({ phase: "error", error: toFeatureError(error) });
    }
  }, [client, content]);

  useEffect(() => {
    void runAnalyze();
  }, [runAnalyze]);

  useEffect(() => {
    if (!detailOpen) {
      return;
    }
    if (tab === "verify" && verifyState.phase === "idle") {
      void runVerify();
    }
    if (tab === "trace" && traceState.phase === "idle") {
      void runTrace();
    }
    if (tab === "related" && relatedState.phase === "idle") {
      void runRelated();
    }
    if (tab === "sources" && sourcesState.phase === "idle") {
      void runVerify();
    }
  }, [
    detailOpen,
    relatedState.phase,
    runRelated,
    runTrace,
    runVerify,
    sourcesState.phase,
    tab,
    traceState.phase,
    verifyState.phase,
  ]);

  const openSettings = () => {
    void chrome.runtime.openOptionsPage();
  };

  return (
    <SlopLensUiRoot
      locale={locale}
      themePreference={themePreference}
      onThemePreferenceChange={onThemePreferenceChange}
    >
      <SlopLensShell
        signals={{
          decision,
          primarySourceLabel,
          similarCount,
        }}
        detailOpen={detailOpen}
        onDetailOpenChange={setDetailOpen}
        activeTab={tab}
        onTabChange={setTab}
        analyzeState={analyzeState}
        verifyState={verifyState}
        traceState={traceState}
        sourcesState={sourcesState}
        relatedState={relatedState}
        analyze={{
          decision,
          summary: decision ? formatAnalyzeSummary(locale, decision) : undefined,
        }}
        verify={verify}
        trace={trace}
        sources={sources}
        related={related}
        onRetryAnalyze={() => void runAnalyze()}
        onRetryVerify={() => void runVerify()}
        onRetryTrace={() => void runTrace()}
        onOpenSettings={openSettings}
      />
    </SlopLensUiRoot>
  );
}

function claimFromContent(content: NormalizedContent): string {
  const parts = [content.title, content.text].filter((part): part is string =>
    Boolean(part?.trim()),
  );
  const claim = parts.join("\n").trim();
  return (claim.length > 0 ? claim : content.url).slice(0, 1500);
}

function stanceFromEvidence(
  stances: ReadonlyArray<"supports" | "contradicts" | "neutral">,
): VerifyPanelContent["stance"] {
  const hasSupport = stances.includes("supports");
  const hasContradict = stances.includes("contradicts");
  if (hasSupport && hasContradict) {
    return "mixed";
  }
  if (hasSupport) {
    return "supported";
  }
  if (hasContradict) {
    return "contradicted";
  }
  return "unverified";
}
