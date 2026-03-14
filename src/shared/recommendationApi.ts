import { recommendAlternatives } from "../engine/recommender"
import { enrichWithReason } from "../engine/llmCopy"
import type {
  RecommendationContext,
  RecommendationResponse,
  AlternativeSuggestion,
} from "../engine/types"

// In a future version, this module can call a real backend API instead of
// running the recommendation logic inside the extension.

export async function requestAlternativeRecommendations(
  ctx: RecommendationContext,
): Promise<RecommendationResponse> {
  // Local in-extension implementation:
  const base = recommendAlternatives(ctx)

  const enriched: AlternativeSuggestion[] = []
  for (const alt of base.alternatives) {
    // eslint-disable-next-line no-await-in-loop
    const withReason = await enrichWithReason(alt, base.currentEstimate?.kgCO2e)
    enriched.push(withReason)
  }

  return {
    ...base,
    alternatives: enriched,
  }
}

