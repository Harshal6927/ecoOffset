import type { AnalysisConfidence, ParsedProductInput, ProductCarbonAnalysisResult } from "./types.ts"

type CategoryRule = {
  id: string
  keywords: string[]
  baseKgCO2e: number
  contributor: string
  assumptions: string[]
}

type FactorRule = {
  keywords: string[]
  addKgCO2e: number
  contributor?: string
  assumption: string
  confidenceBoost?: number
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    id: "electronics",
    keywords: ["laptop", "phone", "iphone", "android", "tablet", "monitor", "headphones", "earbuds", "camera", "charger"],
    baseKgCO2e: 16.5,
    contributor: "Manufacturing dominates here because electronics require component-heavy production, metals, and assembly.",
    assumptions: ["Electronics start from a higher manufacturing baseline because production is material- and energy-intensive."],
  },
  {
    id: "appliance",
    keywords: ["blender", "toaster", "vacuum", "air fryer", "kettle", "coffee maker"],
    baseKgCO2e: 11.8,
    contributor: "Manufacturing is a major driver because small appliances rely on motors, metals, and molded plastics.",
    assumptions: ["Appliances are treated as moderately high-impact manufactured goods."],
  },
  {
    id: "apparel",
    keywords: ["shirt", "hoodie", "jacket", "jeans", "dress", "socks", "sweater", "leggings", "sneakers", "shoes"],
    baseKgCO2e: 5.4,
    contributor: "Material production and finishing drive much of the footprint for apparel and footwear.",
    assumptions: ["Apparel starts from a medium baseline before material and shipping adjustments."],
  },
  {
    id: "drinkware",
    keywords: ["bottle", "tumbler", "mug", "cup", "flask", "thermos"],
    baseKgCO2e: 3.3,
    contributor: "The product body and finishing process form the baseline footprint for drinkware.",
    assumptions: ["Drinkware starts from a moderate baseline and shifts based on material cues."],
  },
  {
    id: "glassware",
    keywords: ["glass", "jar", "vase", "bowl", "plate", "pitcher"],
    baseKgCO2e: 6.2,
    contributor: "Heavier glass products usually carry extra transport and protective-packaging impact.",
    assumptions: ["Glass-like products start from a heavier shipping and packaging baseline."],
  },
  {
    id: "personal-care",
    keywords: ["soap", "detergent", "cleaner", "shampoo", "conditioner", "toothpaste", "lotion", "serum"],
    baseKgCO2e: 4.4,
    contributor: "Packaging and repeat-purchase manufacturing are significant drivers for consumables.",
    assumptions: ["Consumables start from a packaging-heavy baseline."],
  },
  {
    id: "home-goods",
    keywords: ["chair", "desk", "table", "lamp", "shelf", "storage bin", "organizer", "blanket"],
    baseKgCO2e: 8.9,
    contributor: "Bulkier home goods usually have more raw material and shipping weight per purchase.",
    assumptions: ["Home goods start above the generic consumer-goods baseline because they are often larger and heavier."],
  },
  {
    id: "food-pack",
    keywords: ["snack", "coffee", "tea", "protein bar", "granola", "pods", "capsules"],
    baseKgCO2e: 2.6,
    contributor: "Packaging and transport usually dominate packaged food and drink estimates.",
    assumptions: ["Packaged food starts from a lower baseline but is sensitive to packaging and pack size."],
  },
]

const MATERIAL_RULES: FactorRule[] = [
  {
    keywords: ["plastic", "polypropylene", "pet", "pvc"],
    addKgCO2e: 1.8,
    contributor: "Material choice raises the estimate because plastic-heavy products rely on fossil-based feedstocks and processing.",
    assumption: "Plastic cues increase the materials estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["polyester", "nylon", "synthetic"],
    addKgCO2e: 2.4,
    contributor: "Synthetic fiber production is treated as a higher-impact textile signal.",
    assumption: "Synthetic fabric cues increase the textile estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["cotton", "organic cotton"],
    addKgCO2e: 1.3,
    contributor: "Material choice adds emissions because cotton still carries agricultural and processing impacts.",
    assumption: "Cotton is treated as a medium-impact apparel material.",
    confidenceBoost: 1,
  },
  {
    keywords: ["stainless steel", "steel", "metal", "aluminum"],
    addKgCO2e: 2.5,
    contributor: "Material choice adds manufacturing emissions because metal production is energy-intensive.",
    assumption: "Metal cues increase the manufacturing estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["glass", "ceramic"],
    addKgCO2e: 1.6,
    contributor: "Material weight and fragility increase shipping and packaging assumptions.",
    assumption: "Glass and ceramic cues increase shipping and packaging assumptions.",
    confidenceBoost: 1,
  },
  {
    keywords: ["bamboo", "wooden", "wood"],
    addKgCO2e: 0.8,
    assumption: "Wood-based materials add a smaller manufacturing adjustment than metals or electronics.",
  },
]

const SHIPPING_RULES: FactorRule[] = [
  {
    keywords: ["imported", "overseas", "international", "global", "made in china", "made in india", "made in vietnam"],
    addKgCO2e: 3.4,
    contributor: "Shipping distance increases the estimate when the text suggests overseas manufacturing or fulfillment.",
    assumption: "Longer shipping distance is added when overseas cues are present.",
    confidenceBoost: 2,
  },
  {
    keywords: ["local", "made in usa", "made in canada", "regional"],
    addKgCO2e: -1.1,
    assumption: "Local production cues slightly reduce the shipping estimate.",
    confidenceBoost: 1,
  },
]

const PACKAGING_RULES: FactorRule[] = [
  {
    keywords: ["fragile", "gift set", "boxed set"],
    addKgCO2e: 1.4,
    contributor: "Packaging demand increases for fragile or presentation-heavy products.",
    assumption: "Protective or gift-style packaging increases the packaging estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["multi-pack", "multipack", "bundle", "set of", "case of", "bulk", "pack of"],
    addKgCO2e: 2.2,
    contributor: "Packaging and total materials increase when multiple items are bundled into one purchase.",
    assumption: "Pack-size keywords increase the total footprint estimate.",
    confidenceBoost: 2,
  },
  {
    keywords: ["refill", "refill pouch", "minimal packaging"],
    addKgCO2e: -0.8,
    assumption: "Refill-oriented packaging slightly reduces the packaging estimate.",
  },
]

const USAGE_RULES: FactorRule[] = [
  {
    keywords: ["single-use", "disposable", "one-time", "paper plates", "plastic cups", "plastic bottle pack"],
    addKgCO2e: 2.7,
    contributor: "Single-use design adds impact because manufacturing is spread across fewer uses.",
    assumption: "Single-use cues add a usage penalty.",
    confidenceBoost: 2,
  },
  {
    keywords: ["reusable", "refillable", "durable"],
    addKgCO2e: -1.5,
    assumption: "Reusable design slightly lowers the estimate compared with disposable alternatives.",
    confidenceBoost: 1,
  },
]

const DEFAULT_BASE_KG_CO2E = 4.6
const MIN_ESTIMATE_KG_CO2E = 0.5
const MAX_ESTIMATE_KG_CO2E = 80

const ESTIMATION_METHOD_NOTES = [
  "The estimate starts with a category baseline matched from the product text, or a generic consumer-goods baseline if no category is clear.",
  "It then adjusts the number using keyword cues for materials, manufacturing intensity, shipping distance, packaging, pack size, and whether the item appears reusable or single-use.",
  "This demo is rule-based and does not currently query a live lifecycle database or emission-factor dataset, so the result should be treated as directional rather than exact.",
]

function includesKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function uniqueValues(values: string[]) {
  return [...new Set(values)]
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}

function countKeywordMatches(text: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => {
    return text.includes(keyword) ? count + 1 : count
  }, 0)
}

function getBestCategory(signalText: string) {
  let bestMatch: CategoryRule | null = null
  let bestScore = 0

  for (const rule of CATEGORY_RULES) {
    const score = countKeywordMatches(signalText, rule.keywords)

    if (score > bestScore) {
      bestScore = score
      bestMatch = rule
    }
  }

  return bestMatch
}

function extractPackQuantity(signalText: string) {
  const packMatch = signalText.match(/\b(?:pack of|set of|bundle of|case of)\s*(\d{1,2})\b|\b(\d{1,2})\s*(?:pack|count)\b/)

  if (!packMatch) {
    return null
  }

  const quantity = Number(packMatch[1] || packMatch[2])
  return Number.isFinite(quantity) && quantity > 1 ? quantity : null
}

function getConfidenceLevel(confidenceScore: number): AnalysisConfidence {
  if (confidenceScore >= 6) {
    return "high"
  }

  if (confidenceScore >= 3) {
    return "medium"
  }

  return "low"
}

function applyFactorRules(rules: FactorRule[], signalText: string, contributors: string[], assumptions: string[]) {
  let estimateAdjustment = 0
  let confidenceBoost = 0

  for (const rule of rules) {
    if (!includesKeyword(signalText, rule.keywords)) {
      continue
    }

    estimateAdjustment += rule.addKgCO2e
    assumptions.push(rule.assumption)

    if (rule.contributor && rule.addKgCO2e > 0) {
      contributors.push(rule.contributor)
    }

    confidenceBoost += rule.confidenceBoost ?? 1
  }

  return {
    estimateAdjustment,
    confidenceBoost,
  }
}

function buildImpactComparisons(signalText: string, categoryId: string | null) {
  const comparisons: string[] = []

  if (categoryId === "drinkware" || includesKeyword(signalText, ["bottle", "tumbler", "mug", "flask"])) {
    if (includesKeyword(signalText, ["plastic", "single-use", "disposable", "multi-pack", "pack of"])) {
      comparisons.push("A reusable or recycled-content bottle would usually score lower here because the impact is spread across many uses and packaging per use drops.")
    } else {
      comparisons.push("A longer-lasting reusable bottle usually lowers impact per use compared with repeatedly buying single-use drink containers.")
    }
  }

  if (categoryId === "apparel") {
    comparisons.push("A more durable or recycled-fiber version would usually lower the materials portion of this estimate compared with virgin synthetic apparel.")
  }

  if (categoryId === "personal-care" || includesKeyword(signalText, ["refill", "pouch", "detergent", "shampoo", "soap"])) {
    comparisons.push("A refill format or minimal-packaging version would usually lower the packaging share of this estimate.")
  }

  if (includesKeyword(signalText, ["imported", "overseas", "international", "global", "made in china", "made in india", "made in vietnam"])) {
    comparisons.push("A locally made alternative would usually lower the shipping portion of this estimate.")
  }

  if (includesKeyword(signalText, ["fragile", "gift set", "boxed set", "multi-pack", "multipack", "bundle", "case of", "pack of"])) {
    comparisons.push("A simpler packaging format would usually lower the packaging adjustment in this estimate.")
  }

  if (comparisons.length === 0) {
    comparisons.push("A version that is more durable, uses less virgin material, ships a shorter distance, or needs less packaging would usually score lower in this estimate.")
  }

  return uniqueValues(comparisons).slice(0, 2)
}

export function estimateProductCarbonImpact(parsedInput: ParsedProductInput): ProductCarbonAnalysisResult {
  const contributors: string[] = []
  const assumptions: string[] = []
  let estimatedKgCO2e = DEFAULT_BASE_KG_CO2E
  let confidenceScore = 1

  const categoryRule = getBestCategory(parsedInput.signalText)

  if (categoryRule) {
    estimatedKgCO2e = categoryRule.baseKgCO2e
    contributors.push(categoryRule.contributor)
    assumptions.push(...categoryRule.assumptions)
    confidenceScore += 2
  } else {
    contributors.push("A generic manufacturing baseline was used because the product category could not be confidently matched.")
    assumptions.push("Unknown products use a generic consumer-goods baseline before material and shipping adjustments.")
  }

  const factorGroups = [
    applyFactorRules(MATERIAL_RULES, parsedInput.signalText, contributors, assumptions),
    applyFactorRules(SHIPPING_RULES, parsedInput.signalText, contributors, assumptions),
    applyFactorRules(PACKAGING_RULES, parsedInput.signalText, contributors, assumptions),
    applyFactorRules(USAGE_RULES, parsedInput.signalText, contributors, assumptions),
  ]

  for (const group of factorGroups) {
    estimatedKgCO2e += group.estimateAdjustment
    confidenceScore += group.confidenceBoost
  }

  const packQuantity = extractPackQuantity(parsedInput.signalText)

  if (packQuantity) {
    const packAdjustment = clamp((packQuantity - 1) * 0.45, 0.5, 6)
    estimatedKgCO2e += packAdjustment
    contributors.push("Packaging increases the footprint because the product text suggests multiple units in one purchase.")
    assumptions.push(`Pack quantity was estimated from the product text and adjusted for about ${packQuantity} units.`)
    confidenceScore += 1
  }

  if (parsedInput.extractedTitle) {
    confidenceScore += 1
  }

  if (parsedInput.providedName.split(/\s+/).filter(Boolean).length >= 2) {
    confidenceScore += 1
  }

  const finalEstimate = roundToSingleDecimal(clamp(estimatedKgCO2e, MIN_ESTIMATE_KG_CO2E, MAX_ESTIMATE_KG_CO2E))
  const impactComparisons = buildImpactComparisons(parsedInput.signalText, categoryRule?.id ?? null)

  return {
    productName: parsedInput.displayName,
    estimatedKgCO2e: finalEstimate,
    contributors: uniqueValues(contributors).slice(0, 3),
    confidence: getConfidenceLevel(confidenceScore),
    assumptions: uniqueValues(assumptions).slice(0, 5),
    sourceSummary: parsedInput.sourceSummary,
    methodology: ESTIMATION_METHOD_NOTES,
    impactComparisons,
  }
}
