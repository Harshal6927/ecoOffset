import type { AlternativeSuggestion } from "./types"

// Optional integration point for @google/generative-ai.
// For now this returns a simple heuristic reason string so the feature
// works without any external API keys.

export async function enrichWithReason(
  suggestion: AlternativeSuggestion,
  currentKgCO2e: number | undefined,
): Promise<AlternativeSuggestion> {
  if (suggestion.reason) return suggestion

  let reason = "Lower estimated production footprint."

  if (suggestion.title.toLowerCase().includes("recycled")) {
    reason = "Uses recycled materials, which typically have a lower production footprint."
  } else if (suggestion.title.toLowerCase().includes("refill")) {
    reason = "Refill format reduces packaging waste compared to single-use items."
  }

  if (typeof currentKgCO2e === "number") {
    reason += " Based on our model, this option emits less carbon than your current choice."
  }

  return {
    ...suggestion,
    reason,
  }
}

