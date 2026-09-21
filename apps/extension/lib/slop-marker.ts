export const SLOP_MARKER_ATTR = "data-sloplens-marked";
export const SLOP_DIMMED_ATTR = "data-sloplens-dimmed";
export const SLOP_REVEAL_ATTR = "data-sloplens-reveal";
export const SLOP_STAMP_ATTR = "data-sloplens-stamp";
export const SLOP_STAMP_ANIMATE_ATTR = "data-sloplens-stamp-animate";
export const SLOP_MARKER_KEY_ATTR = "data-sloplens-content-key";
export const SLOP_MARKER_SCORE_ATTR = "data-sloplens-score";
export const SLOP_MARKER_THRESHOLD_ATTR = "data-sloplens-threshold";
export const SLOP_MARKER_DIM_ATTR = "data-sloplens-want-dim";
export const SLOP_MARKER_STAMP_FLAG_ATTR = "data-sloplens-want-stamp";

/** Dimmed content stays readable. Tune in-browser inside 0.45–0.65. */
export const MARKED_CONTENT_OPACITY = 0.55;

const STYLE_ID = "sloplens-host-marker-style";

const HOST_CSS = `
[${SLOP_MARKER_ATTR}="true"] {
  position: relative;
}
[${SLOP_DIMMED_ATTR}="true"] {
  opacity: ${MARKED_CONTENT_OPACITY} !important;
  transition: opacity 180ms ease;
}
[${SLOP_MARKER_ATTR}="true"][${SLOP_REVEAL_ATTR}="true"] [${SLOP_DIMMED_ATTR}="true"],
[${SLOP_DIMMED_ATTR}="true"]:hover,
[${SLOP_DIMMED_ATTR}="true"]:focus-within {
  opacity: 1 !important;
}
[${SLOP_STAMP_ATTR}] {
  pointer-events: none;
  position: absolute;
  inset: 12% 8%;
  display: grid;
  place-items: center;
  z-index: 2;
  transition: opacity 180ms ease;
}
[${SLOP_MARKER_ATTR}="true"][${SLOP_REVEAL_ATTR}="true"] [${SLOP_STAMP_ATTR}],
[${SLOP_MARKER_ATTR}="true"]:has([${SLOP_DIMMED_ATTR}="true"]:hover) [${SLOP_STAMP_ATTR}],
[${SLOP_MARKER_ATTR}="true"]:has([${SLOP_DIMMED_ATTR}="true"]:focus-within) [${SLOP_STAMP_ATTR}] {
  opacity: 0.12;
}
[${SLOP_STAMP_ATTR}] span {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(2.4rem, 10vw, 4.6rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 3px rgba(220, 38, 38, 0.72);
  transform: rotate(-14deg);
}
[${SLOP_STAMP_ATTR}][${SLOP_STAMP_ANIMATE_ATTR}] span {
  animation: sloplens-stamp-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  [${SLOP_DIMMED_ATTR}="true"] {
    transition: none;
  }
  [${SLOP_STAMP_ATTR}][${SLOP_STAMP_ANIMATE_ATTR}] span {
    animation: sloplens-stamp-fade 160ms ease both;
    transform: rotate(-14deg);
  }
}
:host([data-reduce-motion="true"]) [${SLOP_STAMP_ATTR}][${SLOP_STAMP_ANIMATE_ATTR}] span,
[data-reduce-motion="true"] [${SLOP_STAMP_ATTR}][${SLOP_STAMP_ANIMATE_ATTR}] span,
html[data-reduce-motion="true"] [${SLOP_STAMP_ATTR}][${SLOP_STAMP_ANIMATE_ATTR}] span {
  animation: sloplens-stamp-fade 160ms ease both;
  transform: rotate(-14deg);
}
:host([data-reduce-motion="true"]) [${SLOP_DIMMED_ATTR}="true"],
[data-reduce-motion="true"] [${SLOP_DIMMED_ATTR}="true"],
html[data-reduce-motion="true"] [${SLOP_DIMMED_ATTR}="true"] {
  transition: none;
}
@keyframes sloplens-stamp-in {
  0% { transform: rotate(-18deg) scale(1.35); opacity: 0; }
  70% { transform: rotate(-12deg) scale(1.06); opacity: 1; }
  100% { transform: rotate(-14deg) scale(1); opacity: 1; }
}
@keyframes sloplens-stamp-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

export type SlopMarkerApplyInput = {
  host: HTMLElement;
  regions: HTMLElement[];
  showStamp: boolean;
  dim: boolean;
  contentKey?: string;
  slopScore?: number;
  threshold?: number;
  reduceMotion?: boolean;
};

type MarkerSnapshot = {
  contentKey: string;
  slopScore: string;
  threshold: string;
  dim: string;
  showStamp: string;
  reduceMotion: string;
};

export function ensureMarkerStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) {
    return;
  }
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = HOST_CSS;
  doc.documentElement.append(style);
}

export function applySlopMarker(input: SlopMarkerApplyInput): void {
  ensureMarkerStyles(input.host.ownerDocument);
  const desired = toSnapshot(input);
  const current = readSnapshot(input.host);
  const stamp = findStamp(input.host);

  if (snapshotsEqual(current, desired) && Boolean(stamp) === input.showStamp) {
    syncDimRegions(input.host, input.regions, input.dim);
    bindReveal(input.host);
    return;
  }

  input.host.setAttribute(SLOP_MARKER_ATTR, "true");
  if (input.reduceMotion) {
    input.host.dataset.reduceMotion = "true";
  } else {
    delete input.host.dataset.reduceMotion;
  }
  writeSnapshot(input.host, desired);
  syncDimRegions(input.host, input.regions, input.dim);

  if (input.showStamp) {
    if (stamp) {
      // Reuse the existing node. Never restart the entrance animation.
      stamp.removeAttribute(SLOP_STAMP_ANIMATE_ATTR);
    } else {
      createStamp(input.host);
    }
  } else if (stamp) {
    stamp.remove();
  }

  bindReveal(input.host);
}

export function clearSlopMarker(host: HTMLElement): void {
  host.removeAttribute(SLOP_MARKER_ATTR);
  host.removeAttribute(SLOP_REVEAL_ATTR);
  host.removeAttribute(SLOP_MARKER_KEY_ATTR);
  host.removeAttribute(SLOP_MARKER_SCORE_ATTR);
  host.removeAttribute(SLOP_MARKER_THRESHOLD_ATTR);
  host.removeAttribute(SLOP_MARKER_DIM_ATTR);
  host.removeAttribute(SLOP_MARKER_STAMP_FLAG_ATTR);
  findStamp(host)?.remove();
  for (const region of host.querySelectorAll(`[${SLOP_DIMMED_ATTR}]`)) {
    region.removeAttribute(SLOP_DIMMED_ATTR);
  }
}

export function isSlopLensOwnedNode(node: Node | null): boolean {
  if (!node) {
    return false;
  }
  if (node instanceof Text) {
    return isSlopLensOwnedNode(node.parentElement);
  }
  if (!(node instanceof Element)) {
    return false;
  }
  if (node.id === STYLE_ID) {
    return true;
  }
  if (node.localName === "sloplens-root") {
    return true;
  }
  if (
    node.hasAttribute(SLOP_STAMP_ATTR) ||
    node.hasAttribute(SLOP_MARKER_ATTR) ||
    node.hasAttribute(SLOP_DIMMED_ATTR) ||
    node.hasAttribute(SLOP_STAMP_ANIMATE_ATTR)
  ) {
    return true;
  }
  if (node.closest("sloplens-root")) {
    return true;
  }
  if (node.closest(`[${SLOP_STAMP_ATTR}]`)) {
    return true;
  }
  return false;
}

export function mutationsAreOnlySlopLens(mutations: MutationRecord[]): boolean {
  if (mutations.length === 0) {
    return true;
  }
  return mutations.every((mutation) => {
    const related: Node[] = [mutation.target, ...mutation.addedNodes, ...mutation.removedNodes];
    return related.every((node) => isSlopLensOwnedNode(node));
  });
}

function toSnapshot(input: SlopMarkerApplyInput): MarkerSnapshot {
  return {
    contentKey: input.contentKey ?? "",
    slopScore: formatScore(input.slopScore),
    threshold: formatScore(input.threshold),
    dim: input.dim ? "1" : "0",
    showStamp: input.showStamp ? "1" : "0",
    reduceMotion: input.reduceMotion ? "1" : "0",
  };
}

function readSnapshot(host: HTMLElement): MarkerSnapshot | null {
  if (host.getAttribute(SLOP_MARKER_ATTR) !== "true") {
    return null;
  }
  return {
    contentKey: host.getAttribute(SLOP_MARKER_KEY_ATTR) ?? "",
    slopScore: host.getAttribute(SLOP_MARKER_SCORE_ATTR) ?? "",
    threshold: host.getAttribute(SLOP_MARKER_THRESHOLD_ATTR) ?? "",
    dim: host.getAttribute(SLOP_MARKER_DIM_ATTR) ?? "",
    showStamp: host.getAttribute(SLOP_MARKER_STAMP_FLAG_ATTR) ?? "",
    reduceMotion: host.dataset.reduceMotion === "true" ? "1" : "0",
  };
}

function writeSnapshot(host: HTMLElement, snapshot: MarkerSnapshot): void {
  host.setAttribute(SLOP_MARKER_KEY_ATTR, snapshot.contentKey);
  host.setAttribute(SLOP_MARKER_SCORE_ATTR, snapshot.slopScore);
  host.setAttribute(SLOP_MARKER_THRESHOLD_ATTR, snapshot.threshold);
  host.setAttribute(SLOP_MARKER_DIM_ATTR, snapshot.dim);
  host.setAttribute(SLOP_MARKER_STAMP_FLAG_ATTR, snapshot.showStamp);
}

function snapshotsEqual(current: MarkerSnapshot | null, desired: MarkerSnapshot): boolean {
  if (!current) {
    return false;
  }
  return (
    current.contentKey === desired.contentKey &&
    current.slopScore === desired.slopScore &&
    current.threshold === desired.threshold &&
    current.dim === desired.dim &&
    current.showStamp === desired.showStamp &&
    current.reduceMotion === desired.reduceMotion
  );
}

function formatScore(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }
  return String(Math.round(value * 1000) / 1000);
}

function findStamp(host: HTMLElement): HTMLElement | null {
  return host.querySelector<HTMLElement>(`[${SLOP_STAMP_ATTR}]`);
}

function syncDimRegions(host: HTMLElement, regions: HTMLElement[], dim: boolean): void {
  const wanted = new Set(dim ? regions : []);
  for (const region of host.querySelectorAll(`[${SLOP_DIMMED_ATTR}]`)) {
    if (!wanted.has(region as HTMLElement)) {
      region.removeAttribute(SLOP_DIMMED_ATTR);
    }
  }
  if (!dim) {
    return;
  }
  for (const region of regions) {
    region.setAttribute(SLOP_DIMMED_ATTR, "true");
  }
}

function createStamp(host: HTMLElement): HTMLElement {
  const stamp = host.ownerDocument.createElement("div");
  stamp.setAttribute(SLOP_STAMP_ATTR, "true");
  stamp.setAttribute("aria-hidden", "true");
  stamp.setAttribute(SLOP_STAMP_ANIMATE_ATTR, "true");
  const mark = host.ownerDocument.createElement("span");
  mark.textContent = "SLOP";
  stamp.append(mark);
  stamp.addEventListener(
    "animationend",
    () => {
      stamp.removeAttribute(SLOP_STAMP_ANIMATE_ATTR);
    },
    { once: true },
  );
  host.append(stamp);
  return stamp;
}

function bindReveal(host: HTMLElement): void {
  if (host.dataset.sloplensRevealBound === "true") {
    return;
  }
  host.dataset.sloplensRevealBound = "true";
  const toggle = () => {
    const next = host.getAttribute(SLOP_REVEAL_ATTR) === "true" ? "false" : "true";
    if (next === "true") {
      host.setAttribute(SLOP_REVEAL_ATTR, "true");
    } else {
      host.removeAttribute(SLOP_REVEAL_ATTR);
    }
  };
  host.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });
  host.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      toggle();
    }
  });
}
