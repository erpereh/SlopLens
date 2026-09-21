import { validateProviderBaseUrl } from "./provider-base-url";
import type { ProviderSelection } from "./selection";

export const TYPESAFE_PROVIDER_ID = "typesafe";
export const DEFAULT_TYPESAFE_MODEL_ID = "jev-latest";
export const LEGACY_DECISION_PROVIDER_ID = "jev";
export const LEGACY_GATEWAY_DECISION_MODEL_ID = "typesafe-ai/jev";

export function isLegacyDecisionSelection(selection: ProviderSelection): boolean {
  return (
    selection.capability === "decision" &&
    (selection.providerId === LEGACY_DECISION_PROVIDER_ID ||
      selection.modelId === LEGACY_GATEWAY_DECISION_MODEL_ID)
  );
}

export function normalizeDecisionSelection(selection: ProviderSelection): ProviderSelection {
  if (!isLegacyDecisionSelection(selection)) {
    return selection;
  }

  const next: ProviderSelection = {
    ...selection,
    providerId: TYPESAFE_PROVIDER_ID,
    modelId: DEFAULT_TYPESAFE_MODEL_ID,
  };

  if (next.baseUrl && validateProviderBaseUrl(TYPESAFE_PROVIDER_ID, next.baseUrl) !== null) {
    const { baseUrl: _dropped, ...rest } = next;
    return rest;
  }

  return next;
}

export function normalizeProviderSelections(
  selections: ReadonlyArray<ProviderSelection>,
): ProviderSelection[] {
  return selections.map(normalizeDecisionSelection);
}

function selectionIdentity(selection: ProviderSelection): string {
  return [
    selection.capability,
    selection.providerId,
    selection.modelId ?? "",
    selection.baseUrl ?? "",
  ].join("|");
}

export function providerSelectionsEqual(
  left: ReadonlyArray<ProviderSelection>,
  right: ReadonlyArray<ProviderSelection>,
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightKeys = right.map(selectionIdentity).sort();
  return left
    .map(selectionIdentity)
    .sort()
    .every((key, index) => key === rightKeys[index]);
}
