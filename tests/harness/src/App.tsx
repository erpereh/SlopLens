import type { ContentDecision } from "@sloplens/core";
import { deriveSlopSignal } from "@sloplens/core";
import {
  type FeatureViewState,
  formatAnalyzeSummary,
  type RelatedItem,
  SlopLensShell,
  SlopLensUiRoot,
  type ThemePreference,
  type TracePanelContent,
  type VerifyPanelContent,
} from "@sloplens/ui";
import { type ReactNode, useMemo, useState } from "react";

const decision: ContentDecision = {
  aiSlop: 0.82,
  engagementBait: 0.4,
  clickbait: 0.91,
  spam: 0.1,
  advertisement: 0.05,
  containsClaim: true,
  needsVerification: true,
  needsWebSearch: true,
  needsImageAnalysis: false,
  needsPowerfulModel: false,
  likelyDuplicate: false,
  contentType: "news",
};

const idle: FeatureViewState = { phase: "idle" };
const success: FeatureViewState = { phase: "success" };
const loading: FeatureViewState = { phase: "loading" };

const verify: VerifyPanelContent = {
  summary: "The claim is backed by the cited note.",
  stance: "supported",
  sources: [{ id: "1", title: "Primary research note", url: "https://example.com/source" }],
};

const related: RelatedItem[] = [
  { id: "1", title: "Related post", url: "https://x.com/other/status/99", platform: "x" },
];

const trace: TracePanelContent = {
  possibleOrigin: {
    url: "https://example.com/origin",
    title: "Origin article",
    whyThisMayBeTheOrigin: "Candidate earlier source, not a confirmed origin.",
    confidence: "low",
  },
  uncertainty: "This is a possible earlier source, not a confirmed origin.",
  related,
  evidence: [{ summary: "Short evidence blurb.", sourceUrl: "https://example.com/origin" }],
};

type Scene = "tweet" | "youtube" | "states";

function sceneFromLocation(): Scene {
  const value = new URLSearchParams(window.location.search).get("scene");
  if (value === "youtube" || value === "states") return value;
  return "tweet";
}

function themeFromLocation(): ThemePreference {
  const value = new URLSearchParams(window.location.search).get("theme");
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function App() {
  const [scene, setScene] = useState<Scene>(sceneFromLocation);
  const [themePreference, setThemePreference] = useState<ThemePreference>(themeFromLocation);
  const [detailOpen, setDetailOpen] = useState(false);
  const slopSignal = deriveSlopSignal(decision);

  const overlay = useMemo(
    () => (
      <SlopLensUiRoot
        locale="en"
        themePreference={themePreference}
        onThemePreferenceChange={setThemePreference}
      >
        <SlopLensShell
          signals={{ slopSignal, decision }}
          detailOpen={detailOpen}
          onDetailOpenChange={setDetailOpen}
          analyzeState={success}
          verifyState={success}
          traceState={success}
          analyze={{ decision, summary: formatAnalyzeSummary("en", decision) }}
          verify={verify}
          trace={trace}
          forceDrawer
        />
      </SlopLensUiRoot>
    ),
    [detailOpen, slopSignal, themePreference],
  );

  return (
    <>
      <nav className="harness-chrome" aria-label="Harness scenes">
        <strong>SlopLens harness</strong>
        <a href="?scene=tweet" aria-current={scene === "tweet" ? "page" : undefined}>
          Tweet
        </a>
        <a href="?scene=youtube" aria-current={scene === "youtube" ? "page" : undefined}>
          YouTube
        </a>
        <a href="?scene=states" aria-current={scene === "states" ? "page" : undefined}>
          States
        </a>
        <button type="button" onClick={() => setScene(sceneFromLocation())}>
          Reload scene
        </button>
      </nav>
      {scene === "tweet" ? <TweetHost overlay={overlay} /> : null}
      {scene === "youtube" ? <YouTubeHost overlay={overlay} /> : null}
      {scene === "states" ? (
        <StatesGallery themePreference={themePreference} onTheme={setThemePreference} />
      ) : null}
    </>
  );
}

function TweetHost({ overlay }: { overlay: ReactNode }) {
  return (
    <div className="host-x">
      <div className="timeline">
        <article data-testid="tweet">
          <div data-testid="User-Name">Jane Doe</div>
          <div data-testid="tweetText">Hello from SlopLens</div>
          <time dateTime="2026-01-15T12:00:00.000Z">Jan 15</time>
        </article>
        <div className="sloplens-host">{overlay}</div>
      </div>
    </div>
  );
}

function YouTubeHost({ overlay }: { overlay: ReactNode }) {
  return (
    <div className="host-yt">
      <div className="player" aria-hidden="true" />
      <div id="primary-inner">
        <h1 className="ytd-watch-metadata">Clickbait title</h1>
        <div id="owner">
          <a href="/channel/x">Creator Channel</a>
        </div>
        <div className="sloplens-host">{overlay}</div>
      </div>
    </div>
  );
}

function StatesGallery({
  themePreference,
  onTheme,
}: {
  themePreference: ThemePreference;
  onTheme: (next: ThemePreference) => void;
}) {
  const error: FeatureViewState = {
    phase: "error",
    error: { code: "backend_unavailable", retryable: true },
  };

  return (
    <div className="states-grid">
      <section>
        <h2>Loading</h2>
        <SlopLensUiRoot
          locale="en"
          themePreference={themePreference}
          onThemePreferenceChange={onTheme}
        >
          <SlopLensShell signals={{}} analyzeState={loading} verifyState={idle} traceState={idle} />
        </SlopLensUiRoot>
      </section>
      <section>
        <h2>Backend offline</h2>
        <SlopLensUiRoot
          locale="en"
          themePreference={themePreference}
          onThemePreferenceChange={onTheme}
        >
          <SlopLensShell
            signals={{}}
            analyzeState={error}
            verifyState={idle}
            traceState={idle}
            onRetryAnalyze={() => undefined}
          />
        </SlopLensUiRoot>
      </section>
      <section>
        <h2>Success</h2>
        <SlopLensUiRoot
          locale="en"
          themePreference={themePreference}
          onThemePreferenceChange={onTheme}
        >
          <SlopLensShell
            signals={{ slopSignal: deriveSlopSignal(decision), decision }}
            analyzeState={success}
            verifyState={success}
            traceState={{ phase: "empty" }}
            analyze={{ decision, summary: formatAnalyzeSummary("en", decision) }}
            verify={{ stance: "unverified", summary: "No corroborating sources yet." }}
            forceDrawer
          />
        </SlopLensUiRoot>
      </section>
    </div>
  );
}
