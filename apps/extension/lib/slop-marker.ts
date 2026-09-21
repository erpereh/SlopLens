export const SLOP_MARKER_ATTR = "data-sloplens-marked";
export const SLOP_DIMMED_ATTR = "data-sloplens-dimmed";
export const SLOP_REVEAL_ATTR = "data-sloplens-reveal";
export const SLOP_STAMP_ATTR = "data-sloplens-stamp";

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
  animation: sloplens-stamp-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  [${SLOP_DIMMED_ATTR}="true"] {
    transition: none;
  }
  [${SLOP_STAMP_ATTR}] span {
    animation: sloplens-stamp-fade 160ms ease both;
    transform: rotate(-14deg);
  }
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

export function ensureMarkerStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) {
    return;
  }
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = HOST_CSS;
  doc.documentElement.append(style);
}

export function applySlopMarker(input: {
  host: HTMLElement;
  regions: HTMLElement[];
  showStamp: boolean;
  dim: boolean;
}): void {
  ensureMarkerStyles(input.host.ownerDocument);
  input.host.setAttribute(SLOP_MARKER_ATTR, "true");
  input.host.toggleAttribute(SLOP_REVEAL_ATTR, false);
  for (const region of input.regions) {
    if (input.dim) {
      region.setAttribute(SLOP_DIMMED_ATTR, "true");
    } else {
      region.removeAttribute(SLOP_DIMMED_ATTR);
    }
  }
  const existing = input.host.querySelector(`[${SLOP_STAMP_ATTR}]`);
  existing?.remove();
  if (input.showStamp) {
    const stamp = input.host.ownerDocument.createElement("div");
    stamp.setAttribute(SLOP_STAMP_ATTR, "true");
    stamp.setAttribute("aria-hidden", "true");
    const mark = input.host.ownerDocument.createElement("span");
    mark.textContent = "SLOP";
    stamp.append(mark);
    input.host.append(stamp);
  }
  bindReveal(input.host);
}

export function clearSlopMarker(host: HTMLElement): void {
  host.removeAttribute(SLOP_MARKER_ATTR);
  host.removeAttribute(SLOP_REVEAL_ATTR);
  host.querySelector(`[${SLOP_STAMP_ATTR}]`)?.remove();
  for (const region of host.querySelectorAll(`[${SLOP_DIMMED_ATTR}]`)) {
    region.removeAttribute(SLOP_DIMMED_ATTR);
  }
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
