import { z } from "zod";

import { type ContentDecision, unitScoreSchema } from "./decision";

export const SLOP_SIGNAL_SOURCES = ["aiSlop"] as const;

export const slopSignalSourceSchema = z.enum(SLOP_SIGNAL_SOURCES);

export const slopPresentationSignalSchema = z
  .object({
    value: unitScoreSchema,
    label: z.literal("slop"),
    source: slopSignalSourceSchema,
  })
  .strict();

export type SlopSignalSource = z.infer<typeof slopSignalSourceSchema>;
export type SlopPresentationSignal = z.infer<typeof slopPresentationSignalSchema>;

/**
 * Presentation signal for the feed chip, dimming and stamp.
 * This iteration derives it from `aiSlop` only. Overlay chrome must read
 * this helper — not `decision.aiSlop` — so later combinations can land here.
 */
export function deriveSlopSignal(decision: ContentDecision): SlopPresentationSignal {
  return {
    value: decision.aiSlop,
    label: "slop",
    source: "aiSlop",
  };
}

export function slopSignalExceedsThreshold(
  signal: SlopPresentationSignal,
  threshold: number,
): boolean {
  return signal.value >= threshold;
}
