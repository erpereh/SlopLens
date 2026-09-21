import type { ContentDecision } from "@sloplens/core";
import {
  type FeatureViewState,
  type RelatedItem,
  SlopLensShell,
  SlopLensUiRoot,
  type SourceItem,
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
};

const trace: TracePanelContent = {
  summary: "Candidate origin found via similar embeddings.",
  originCandidate: "Origin article",
};

const sources: SourceItem[] = [
  { id: "1", title: "Primary research note", url: "https://example.com/source" },
];

const related: RelatedItem[] = [
  { id: "1", title: "Related post", url: "https://x.com/other/status/99", platform: "x" },
];

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

  const overlay = useMemo(
    () => (
      <SlopLensUiRoot
        locale="en"
        themePreference={themePreference}
        onThemePreferenceChange={setThemePreference}
      >
        <SlopLensShell
          signals={{
            decision,
            primarySourceLabel: "Primary research note",
            similarCount: 1,
          }}
          detailOpen={detailOpen}
          onDetailOpenChange={setDetailOpen}
          analyzeState={success}
          verifyState={success}
          traceState={success}
          sourcesState={success}
          relatedState={success}
          analyze={{ decision, summary: "news · claim" }}
          verify={verify}
          trace={trace}
          sources={sources}
          related={related}
        />
      </SlopLensUiRoot>
    ),
    [detailOpen, themePreference],
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
          <SlopLensShell
            signals={{}}
            analyzeState={loading}
            verifyState={idle}
            traceState={idle}
            sourcesState={idle}
            relatedState={idle}
          />
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
            sourcesState={idle}
            relatedState={idle}
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
            signals={{ decision, primarySourceLabel: null, similarCount: 0 }}
            analyzeState={success}
            verifyState={success}
            traceState={{ phase: "empty" }}
            sourcesState={{ phase: "empty" }}
            relatedState={{ phase: "empty" }}
            analyze={{ decision, summary: "news · claim" }}
            verify={{ stance: "unverified", summary: "No corroborating sources yet." }}
          />
        </SlopLensUiRoot>
      </section>
    </div>
  );
}
