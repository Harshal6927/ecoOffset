import { FootprintRepository } from "./footprintRepository"
import { scoreProductFootprint } from "./footprintScorer"
import type {
  AlternativeCandidate,
  AlternativeSuggestion,
  RecommendationContext,
  RecommendationResponse,
  UserPreferences,
} from "./types"

function computeReductionPercent(current: number, alternative: number): number {
  if (current <= 0) return 0
  const reduction = ((current - alternative) / current) * 100
  return Number(Math.max(0, reduction).toFixed(1))
}

function rankAlternatives(
  current: AlternativeCandidate,
  currentFootprint: number,
  candidates: AlternativeCandidate[],
  prefs: UserPreferences | undefined,
): AlternativeSuggestion[] {
  const sensitivity = prefs?.footprintSensitivity ?? "balanced"

  const scored = candidates.map((candidate) => {
    const footprint = scoreProductFootprint(candidate)
    const reductionPercent = computeReductionPercent(currentFootprint, footprint.kgCO2e)

    const price = candidate.price ?? current.price ?? 0
    const currentPrice = current.price ?? price
    const priceDiffRatio =
      currentPrice > 0 ? Math.abs(price - currentPrice) / currentPrice : 0

    let score = reductionPercent
    if (sensitivity === "balanced") {
      score -= priceDiffRatio * 10
    } else if (sensitivity === "price_friendly") {
      score -= priceDiffRatio * 20
    } else if (sensitivity === "max_reduction") {
      // focus on reduction; small penalty for big price jumps
      score -= priceDiffRatio * 5
    }

    return {
      candidate,
      footprint,
      reductionPercent,
      score,
    }
  })

  return scored
    .filter((s) => s.reductionPercent >= 5 && s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({
      id: s.candidate.asin ?? s.candidate.title,
      title: s.candidate.title,
      imageUrl: s.candidate.imageUrl,
      price: s.candidate.price,
      currency: s.candidate.currency,
      footprint: s.footprint,
      reductionPercent: s.reductionPercent,
    }))
}

export function recommendAlternatives(ctx: RecommendationContext): RecommendationResponse {
  if (ctx.contextType === "product") {
    const current = ctx.product
    const currentEstimate = scoreProductFootprint(current)
    const candidates = FootprintRepository.findSimilarProducts(current, 10).map(
      (entry) =>
        ({
          asin: entry.asin,
          title: entry.title,
          brand: entry.brand,
          categoryPath: entry.categoryPath,
        }) satisfies AlternativeCandidate,
    )

    const alternatives = rankAlternatives(
      current,
      currentEstimate.kgCO2e,
      candidates,
      ctx.userPreferences,
    )

    return {
      currentEstimate,
      alternatives,
    }
  }

  const items = ctx.cartItems
  if (!items.length) {
    return {
      alternatives: [],
    }
  }

  // For now, treat the first item as the primary one; this can be
  // extended to per-item alternatives plus a cart summary.
  const primary = items[0]
  const primaryEstimate = scoreProductFootprint(primary)
  const candidates = FootprintRepository.findSimilarProducts(primary, 10).map(
    (entry) =>
      ({
        asin: entry.asin,
        title: entry.title,
        brand: entry.brand,
        categoryPath: entry.categoryPath,
      }) satisfies AlternativeCandidate,
  )

  const alternatives = rankAlternatives(
    primary,
    primaryEstimate.kgCO2e,
    candidates,
    ctx.userPreferences,
  )

  return {
    currentEstimate: primaryEstimate,
    alternatives,
  }
}

