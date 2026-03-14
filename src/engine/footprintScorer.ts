import { FootprintRepository } from "./footprintRepository"
import { estimateFootprintFromFeatures } from "./mlEstimator"
import type { FootprintEstimate, ProductFeatures } from "./types"

export function scoreProductFootprint(product: ProductFeatures): FootprintEstimate {
  const datasetEstimate = FootprintRepository.lookupFootprint(product)
  if (datasetEstimate) {
    return datasetEstimate
  }

  const mlEstimate = estimateFootprintFromFeatures(product)
  return mlEstimate
}

