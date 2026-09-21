export { canonicalizeClaimText, extractCanonicalClaim } from "./canonical-claim";
export {
  type NormalizedContent,
  normalizedContentSchema,
} from "./content";
export {
  CONTENT_TYPES,
  type ContentDecision,
  type ContentType,
  contentDecisionSchema,
  contentTypeSchema,
  unitScoreSchema,
} from "./decision";
export {
  MEDIA_KINDS,
  type MediaKind,
  type MediaReference,
  mediaKindSchema,
  mediaReferenceSchema,
} from "./media";
export { PLATFORM_IDS, type Platform, platformSchema } from "./platform";
export {
  CONTENT_RELATION_TYPES,
  type ContentRelationType,
  contentRelationTypeSchema,
} from "./relations";
export {
  deriveSlopSignal,
  SLOP_SIGNAL_SOURCES,
  type SlopPresentationSignal,
  type SlopSignalSource,
  slopPresentationSignalSchema,
  slopSignalExceedsThreshold,
  slopSignalSourceSchema,
} from "./slop-signal";
