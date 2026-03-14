import type { FootprintEstimate, ProductFeatures } from "./types"

// Placeholder representation of your internal dataset. In a real deployment,
// this would be backed by a database or search index.
type DatasetEntry = {
  id: string
  asin?: string
  title: string
  brand?: string
  categoryPath?: string[]
  kgCO2e: number
}

// Example tiny in-memory dataset so the extension has something to work with.
const DATASET: DatasetEntry[] = [
  {
    id: "recycled-bottle-pack",
    asin: "ECO123456",
    title: "Recycled plastic bottle pack",
    brand: "EcoBrand",
    categoryPath: ["Sports", "Hydration"],
    kgCO2e: 1.3,
  },
  {
    id: "standard-bottle-pack",
    asin: "STD987654",
    title: "Standard plastic bottle pack",
    brand: "GenericBrand",
    categoryPath: ["Sports", "Hydration"],
    kgCO2e: 2.0,
  },
]

function stringSimilarity(a: string, b: string): number {
  const na = a.toLowerCase()
  const nb = b.toLowerCase()
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.8
  let common = 0
  const tokensA = na.split(/\s+/)
  const tokensB = nb.split(/\s+/)
  for (const token of tokensA) {
    if (tokensB.includes(token)) common += 1
  }
  const denom = Math.max(tokensA.length, tokensB.length)
  return denom > 0 ? common / denom : 0
}

export class FootprintRepository {
  // Look up a single product in the dataset and return a footprint if found.
  static lookupFootprint(product: ProductFeatures): FootprintEstimate | undefined {
    let best: DatasetEntry | undefined
    let bestScore = 0

    for (const entry of DATASET) {
      let score = 0
      if (product.asin && entry.asin === product.asin) {
        score += 2
      }
      if (product.title) {
        score += stringSimilarity(product.title, entry.title)
      }
      if (product.brand && entry.brand && product.brand === entry.brand) {
        score += 0.5
      }
      if (product.categoryPath && entry.categoryPath) {
        const overlap = product.categoryPath.filter((c) =>
          entry.categoryPath?.includes(c),
        ).length
        score += overlap * 0.2
      }
      if (score > bestScore) {
        bestScore = score
        best = entry
      }
    }

    if (!best || bestScore < 0.7) return undefined

    return {
      kgCO2e: best.kgCO2e,
      source: "dataset",
      confidence: Math.min(1, bestScore / 3),
    }
  }

  // Fetch similar candidate products from the dataset for alternative suggestions.
  static findSimilarProducts(product: ProductFeatures, limit = 5): DatasetEntry[] {
    const scored = DATASET.map((entry) => {
      let score = 0
      if (product.asin && entry.asin === product.asin) {
        score -= 10
      }
      if (product.title) {
        score += stringSimilarity(product.title, entry.title)
      }
      if (product.categoryPath && entry.categoryPath) {
        const overlap = product.categoryPath.filter((c) =>
          entry.categoryPath?.includes(c),
        ).length
        score += overlap * 0.3
      }
      return { entry, score }
    })

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.entry)
  }
}

