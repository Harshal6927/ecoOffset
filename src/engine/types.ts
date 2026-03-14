export type FootprintSource = "dataset" | "ml_estimate"

export type FootprintEstimate = {
  kgCO2e: number
  source: FootprintSource
  confidence: number // 0–1
}

export type ProductIdentity = {
  asin?: string
  title: string
  brand?: string
  categoryPath?: string[]
}

export type ProductFeatures = ProductIdentity & {
  price?: number
  currency?: string
  attributes?: Record<string, string | number | boolean | null | undefined>
}

export type AlternativeCandidate = ProductFeatures & {
  imageUrl?: string
}

export type AlternativeSuggestion = {
  id: string
  title: string
  imageUrl?: string
  price?: number
  currency?: string
  footprint: FootprintEstimate
  reductionPercent: number
  reason?: string
}

export type UserPreferences = {
  footprintSensitivity: "balanced" | "max_reduction" | "price_friendly"
}

export type RecommendationContext =
  | {
      contextType: "product"
      product: ProductFeatures
      userPreferences?: UserPreferences
    }
  | {
      contextType: "cart"
      cartItems: ProductFeatures[]
      userPreferences?: UserPreferences
    }

export type RecommendationResponse = {
  currentEstimate?: FootprintEstimate
  alternatives: AlternativeSuggestion[]
}

