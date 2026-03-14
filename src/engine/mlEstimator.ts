import type { FootprintEstimate, ProductFeatures } from "./types"

// Very small, hand-crafted \"ML-style\" estimator.
// In a real project, you would export learned parameters from a model trained
// on a Kaggle-style dataset and apply them here.

export function estimateFootprintFromFeatures(product: ProductFeatures): FootprintEstimate {
  const baseByCategory: Record<string, number> = {
    default: 2.0,
    hydration: 1.8,
    electronics: 8.0,
    clothing: 5.0,
  }

  const categoryKey = product.categoryPath?.[product.categoryPath.length - 1]?.toLowerCase() ?? ""
  let base = baseByCategory.default
  if (categoryKey.includes("hydration") || categoryKey.includes("bottle")) {
    base = baseByCategory.hydration
  } else if (categoryKey.includes("shirt") || categoryKey.includes("clothing")) {
    base = baseByCategory.clothing
  } else if (categoryKey.includes("laptop") || categoryKey.includes("electronics")) {
    base = baseByCategory.electronics
  }

  // Adjust for price as a very rough proxy for size/material intensity.
  if (typeof product.price === "number") {
    const priceFactor = Math.min(3, Math.max(0.5, product.price / 20))
    base *= priceFactor
  }

  // Simple brand-based tweak (placeholder).
  if (product.brand && /eco|recycl/i.test(product.brand)) {
    base *= 0.7
  }

  return {
    kgCO2e: Number(base.toFixed(2)),
    source: "ml_estimate",
    confidence: 0.5,
  }
}

