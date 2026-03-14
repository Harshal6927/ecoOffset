export type AnalysisConfidence = "low" | "medium" | "high"

export type ProductCarbonAnalysisInput = {
  productUrl: string
  productName: string
}

export type ProductCarbonAnalysisResult = {
  productName: string
  estimatedKgCO2e: number
  contributors: string[]
  confidence: AnalysisConfidence
  assumptions: string[]
}

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
    contributor: "Electronics have a high manufacturing footprint from components, metals, and assembly.",
    assumptions: ["Electronics start from a higher baseline because production is material- and energy-intensive."],
  },
  {
    id: "appliance",
    keywords: ["blender", "toaster", "vacuum", "air fryer", "kettle", "coffee maker"],
    baseKgCO2e: 11.8,
    contributor: "Small appliances usually carry a sizable manufacturing footprint from motors, metals, and plastics.",
    assumptions: ["Appliances are treated as moderately high-impact manufactured goods."],
  },
  {
    id: "apparel",
    keywords: ["shirt", "hoodie", "jacket", "jeans", "dress", "socks", "sweater", "leggings", "sneakers", "shoes"],
    baseKgCO2e: 5.4,
    contributor: "Textile production and finishing drive much of the footprint for clothing and shoes.",
    assumptions: ["Apparel starts from a medium baseline before material and shipping adjustments."],
  },
  {
    id: "drinkware",
    keywords: ["bottle", "tumbler", "mug", "cup", "flask", "thermos"],
    baseKgCO2e: 3.3,
    contributor: "The product body and finishing process are the main baseline impact for drinkware.",
    assumptions: ["Drinkware starts from a moderate baseline and changes a lot based on materials."],
  },
  {
    id: "glassware",
    keywords: ["glass", "jar", "vase", "bowl", "plate", "pitcher"],
    baseKgCO2e: 6.2,
    contributor: "Glass products tend to carry extra transport and packaging impact because they are heavier and fragile.",
    assumptions: ["Glass-like products start from a heavier shipping and packaging baseline."],
  },
  {
    id: "personal-care",
    keywords: ["soap", "detergent", "cleaner", "shampoo", "conditioner", "toothpaste", "lotion", "serum"],
    baseKgCO2e: 4.4,
    contributor: "Personal care and cleaning products often carry extra packaging and repeat-purchase impact.",
    assumptions: ["Consumables start from a packaging-heavy baseline."],
  },
  {
    id: "home-goods",
    keywords: ["chair", "desk", "table", "lamp", "shelf", "storage bin", "organizer", "blanket"],
    baseKgCO2e: 8.9,
    contributor: "Home goods usually involve more raw material and bulkier shipping than smaller accessories.",
    assumptions: ["Home goods start above the generic consumer-goods baseline because they are often larger and heavier."],
  },
  {
    id: "food-pack",
    keywords: ["snack", "coffee", "tea", "protein bar", "granola", "pods", "capsules"],
    baseKgCO2e: 2.6,
    contributor: "For packaged food and drink items, packaging and transport often dominate the estimate.",
    assumptions: ["Packaged food starts from a lower baseline but is sensitive to packaging and pack size."],
  },
]

const MATERIAL_RULES: FactorRule[] = [
  {
    keywords: ["plastic", "polypropylene", "pet", "pvc"],
    addKgCO2e: 1.8,
    contributor: "Plastic-heavy materials raise the footprint through fossil-based feedstocks and processing.",
    assumption: "Plastic cues increase the materials estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["polyester", "nylon", "synthetic"],
    addKgCO2e: 2.4,
    contributor: "Synthetic fibers are treated as higher-impact petroleum-based textile materials.",
    assumption: "Synthetic fabric cues increase the textile estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["cotton", "organic cotton"],
    addKgCO2e: 1.3,
    contributor: "Cotton adds agricultural and processing emissions even when the product is not disposable.",
    assumption: "Cotton is treated as a medium-impact apparel material.",
    confidenceBoost: 1,
  },
  {
    keywords: ["stainless steel", "steel", "metal", "aluminum"],
    addKgCO2e: 2.5,
    contributor: "Metal production tends to be energy-intensive, especially for finished consumer products.",
    assumption: "Metal cues increase the manufacturing estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["glass", "ceramic"],
    addKgCO2e: 1.6,
    contributor: "Heavy or brittle materials usually add handling, protective packaging, and shipping weight.",
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
    contributor: "Imported or overseas cues increase transport emissions for the estimate.",
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
    contributor: "Fragile or presentation-heavy products usually require more packaging material.",
    assumption: "Protective or gift-style packaging increases the packaging estimate.",
    confidenceBoost: 1,
  },
  {
    keywords: ["multi-pack", "multipack", "bundle", "set of", "case of", "bulk", "pack of"],
    addKgCO2e: 2.2,
    contributor: "Multi-pack or bulk products increase total materials and packaging per purchase.",
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
    contributor: "Single-use design increases impact because manufacturing is spread across fewer uses.",
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

function normalizeUrl(productUrl: string) {
  const trimmedUrl = productUrl.trim()

  if (!trimmedUrl) {
    return ""
  }

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
}

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

function titleCaseSlug(slug: string) {
  return slug
    .replace(/[-_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
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

export function extractProductTitleFromUrl(productUrl: string) {
  try {
    const normalizedUrl = normalizeUrl(productUrl)

    if (!normalizedUrl) {
      return null
    }

    const url = new URL(normalizedUrl)
    const segments = url.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment).trim())
      .filter(Boolean)

    const amazonIndex = segments.findIndex((segment) => segment.toLowerCase() === "dp")
    const preferredSlug = amazonIndex > 0 ? segments[amazonIndex - 1] : segments.find((segment) => /[a-z]/i.test(segment) && /[-_+]/.test(segment))

    if (!preferredSlug) {
      return null
    }

    // The MVP only converts obvious slug-like segments instead of attempting full scraping.
    const readableTitle = titleCaseSlug(preferredSlug)
      .replace(/\bDp\b/g, "")
      .trim()
    return readableTitle || null
  } catch {
    return null
  }
}

function getDomainFallbackName(productUrl: string) {
  try {
    const normalizedUrl = normalizeUrl(productUrl)

    if (!normalizedUrl) {
      return null
    }

    const url = new URL(normalizedUrl)
    const host = url.hostname.replace(/^www\./i, "")
    const siteName = host.split(".")[0]

    return siteName ? `${siteName.charAt(0).toUpperCase()}${siteName.slice(1)} product` : null
  } catch {
    return null
  }
}

function resolveProductName({ productUrl, productName }: ProductCarbonAnalysisInput) {
  return extractProductTitleFromUrl(productUrl) || productName.trim() || getDomainFallbackName(productUrl) || null
}

export function analyzeProductCarbonImpact(input: ProductCarbonAnalysisInput): ProductCarbonAnalysisResult | null {
  const productName = resolveProductName(input)

  if (!productName) {
    return null
  }

  const signalText = `${productName} ${input.productName} ${input.productUrl}`.toLowerCase().trim()
  const contributors: string[] = []
  const assumptions: string[] = []
  let estimatedKgCO2e = DEFAULT_BASE_KG_CO2E
  let confidenceScore = 1

  const categoryRule = getBestCategory(signalText)

  if (categoryRule) {
    estimatedKgCO2e = categoryRule.baseKgCO2e
    contributors.push(categoryRule.contributor)
    assumptions.push(...categoryRule.assumptions)
    confidenceScore += 2
  } else {
    assumptions.push("Unknown products use a generic consumer-goods baseline before material and shipping adjustments.")
  }

  const factorGroups = [
    applyFactorRules(MATERIAL_RULES, signalText, contributors, assumptions),
    applyFactorRules(SHIPPING_RULES, signalText, contributors, assumptions),
    applyFactorRules(PACKAGING_RULES, signalText, contributors, assumptions),
    applyFactorRules(USAGE_RULES, signalText, contributors, assumptions),
  ]

  for (const group of factorGroups) {
    estimatedKgCO2e += group.estimateAdjustment
    confidenceScore += group.confidenceBoost
  }

  const packQuantity = extractPackQuantity(signalText)

  if (packQuantity) {
    const packAdjustment = clamp((packQuantity - 1) * 0.45, 0.5, 6)
    estimatedKgCO2e += packAdjustment
    contributors.push("Larger pack size increases the total footprint because more units and packaging are included.")
    assumptions.push(`Pack quantity was estimated from the product text and adjusted for about ${packQuantity} units.`)
    confidenceScore += 1
  }

  if (extractProductTitleFromUrl(input.productUrl)) {
    confidenceScore += 1
  }

  if (input.productName.trim().split(/\s+/).filter(Boolean).length >= 2) {
    confidenceScore += 1
  }

  const finalEstimate = roundToSingleDecimal(clamp(estimatedKgCO2e, MIN_ESTIMATE_KG_CO2E, MAX_ESTIMATE_KG_CO2E))

  return {
    productName,
    estimatedKgCO2e: finalEstimate,
    contributors: uniqueValues(contributors).length > 0 ? uniqueValues(contributors).slice(0, 3) : ["General product manufacturing and delivery drive most of this estimate."],
    confidence: getConfidenceLevel(confidenceScore),
    assumptions: uniqueValues(assumptions).slice(0, 5),
  }
}
