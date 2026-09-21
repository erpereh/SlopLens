import type { ContentDecision, NormalizedContent } from "@sloplens/core";

export interface DecisionInput {
  content: NormalizedContent;
}

export interface DecisionProvider {
  readonly providerId: string;
  analyze(input: DecisionInput): Promise<ContentDecision>;
}
