/** Bootstrap defaults only — not domain constants. Override via provider config. */

export const DEFAULT_JEV_MODEL_ID = "typesafe-ai/jev";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_EMBEDDING_MODEL_ID = "nvidia/nemotron-3-embed-1b:free";
export const DEFAULT_VISION_MODEL_ID = "inclusionai/ling-3.0-flash-vl:free";
export const DEFAULT_REASONING_MODEL_ID = "nvidia/nemotron-3-ultra-550b-a55b:free";

export const DEFAULT_TAVILY_BASE_URL = "https://api.tavily.com";

/** Probability at or above this value counts as a positive routing flag. */
export const DEFAULT_DECISION_BOOLEAN_THRESHOLD = 0.6;

export const PROVIDER_IDS = {
  decision: "jev",
  embedding: "openrouter",
  search: "tavily",
  vision: "openrouter",
  reasoning: "openrouter",
} as const;
