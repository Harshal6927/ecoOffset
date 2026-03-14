export type AnalysisConfidence = "low" | "medium" | "high"

export type ProductCarbonAnalysisInput = {
  productUrl: string
  productName: string
}

export type ProductInputSource = "url-title" | "typed-name"

export type ParsedProductInput = {
  displayName: string
  extractedTitle: string | null
  normalizedUrl: string
  providedName: string
  signalText: string
  source: ProductInputSource
  sourceSummary: string
}

export type ProductCarbonAnalysisResult = {
  productName: string
  estimatedKgCO2e: number
  contributors: string[]
  confidence: AnalysisConfidence
  assumptions: string[]
  sourceSummary: string
  methodology: string[]
  impactComparisons: string[]
}

export type EmissionsValue = number | null | undefined

export type OffsetSuggestion = {
  id: string
  label: string
  detail: string
}

export type OffsetSuggestionResult = {
  emissionsKg: number
  treeRange: string
  carbonCreditsTons: string
  suggestions: OffsetSuggestion[]
}
