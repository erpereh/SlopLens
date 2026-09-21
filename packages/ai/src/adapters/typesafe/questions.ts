import { CONTENT_TYPES } from "@sloplens/core";

const contentTypeCriteria = Object.fromEntries(
  CONTENT_TYPES.map((type) => [
    type,
    type === "unknown"
      ? "Does not clearly fit any other category"
      : `Content is primarily ${type.replace("_", " ")}`,
  ]),
) as Record<(typeof CONTENT_TYPES)[number], string>;

export const INFORMATION_QUALITY_LEVELS = 5;
export const ORIGINALITY_LEVELS = 5;

export const jevContentDecisionQuestions = {
  aiSlop: {
    type: "boolean" as const,
    instructions:
      "True only when the text itself is generic AI filler, formulaic mass-produced phrasing, or empty content. A human opinion, joke, reaction, or specific claim is false even if you disagree with it.",
  },
  engagementBait: {
    type: "boolean" as const,
    instructions: "Is this designed mainly to drive engagement rather than inform?",
  },
  clickbait: {
    type: "boolean" as const,
    instructions: "Does the title or framing mislead about the actual content?",
  },
  spam: {
    type: "boolean" as const,
    instructions: "Is this unsolicited repetitive or junk content?",
  },
  advertisement: {
    type: "boolean" as const,
    instructions: "Is this primarily promotional or sponsored material?",
  },
  containsClaim: {
    type: "boolean" as const,
    instructions: "Does the content assert a factual claim that could be checked?",
  },
  needsVerification: {
    type: "boolean" as const,
    instructions: "Should this content be fact-checked before trusting it?",
  },
  needsWebSearch: {
    type: "boolean" as const,
    instructions: "Would external web search help validate or contextualize this?",
  },
  needsImageAnalysis: {
    type: "boolean" as const,
    instructions: "Is understanding an image or thumbnail essential to assess this?",
  },
  needsPowerfulModel: {
    type: "boolean" as const,
    instructions: "Does this require deep reasoning beyond lightweight classification?",
  },
  likelyDuplicate: {
    type: "boolean" as const,
    instructions: "Is this likely a duplicate or near-copy of widely circulated content?",
  },
  contentType: {
    type: "choice" as const,
    instructions: "What type of content is this?",
    criteria: contentTypeCriteria,
  },
  informationQuality: {
    type: "score" as const,
    instructions: "How informative and well-supported is this content?",
    criteria: [
      "Misleading or empty",
      "Mostly noise with little substance",
      "Mixed quality with some useful points",
      "Generally solid and useful",
      "High-quality, well-supported information",
    ],
  },
  originality: {
    type: "score" as const,
    instructions: "How original is this compared to typical recycled content?",
    criteria: [
      "Direct copy or obvious repost",
      "Mostly recycled with minimal changes",
      "Some familiar themes with modest novelty",
      "Fairly fresh angle or synthesis",
      "Highly original or unique perspective",
    ],
  },
};
