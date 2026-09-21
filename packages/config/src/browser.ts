/**
 * Browser-safe config surface.
 * Popup, options, and content scripts must import this entry (or `@sloplens/config/browser`)
 * so Node APIs (fs, keyring, child_process) never enter the extension bundle.
 */
export {
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderSelection,
  providerCapabilitySchema,
  providerSelectionSchema,
} from "./selection";
