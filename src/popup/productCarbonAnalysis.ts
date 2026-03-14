import { estimateProductCarbonImpact } from "./carbonEstimation.ts"
import { parseProductInput } from "./productParsing.ts"
import type { ProductCarbonAnalysisInput, ProductCarbonAnalysisResult } from "./types.ts"

export { extractProductTitleFromUrl, isProbablyUrl } from "./productParsing.ts"
export type { AnalysisConfidence, ProductCarbonAnalysisInput, ProductCarbonAnalysisResult } from "./types.ts"

export function analyzeProductCarbonImpact(input: ProductCarbonAnalysisInput): ProductCarbonAnalysisResult | null {
  const parsedInput = parseProductInput(input)

  if (!parsedInput) {
    return null
  }

  return estimateProductCarbonImpact(parsedInput)
}
