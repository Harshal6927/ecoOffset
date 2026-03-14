import { useState } from "react"

type Contributor = {
  label: string
  value: number
  detail: string
}

type AnalysisResult = {
  displayName: string
  estimatedKg: number
  confidence: "High" | "Medium" | "Exploratory"
  summary: string
  assumptions: string[]
  contributors: Contributor[]
}

type ProductProfile = {
  keywords: string[]
  label: string
  materialKg: number
  manufacturingKg: number
  shippingKg: number
  packagingKg: number
  confidence: AnalysisResult["confidence"]
  assumptions: string[]
}

const PRODUCT_PROFILES: ProductProfile[] = [
  {
    keywords: ["water bottle", "bottle pack", "plastic bottle", "bottled water"],
    label: "Plastic Water Bottle Pack",
    materialKg: 3.2,
    manufacturingKg: 1.4,
    shippingKg: 2.5,
    packagingKg: 1.1,
    confidence: "High",
    assumptions: ["Assumes PET plastic bottles sold in a multi-pack.", "Shipping impact reflects bulk retail delivery over a moderate to long distance."],
  },
  {
    keywords: ["t shirt", "tee", "shirt", "hoodie", "sweatshirt"],
    label: "Clothing Item",
    materialKg: 4.4,
    manufacturingKg: 3.1,
    shippingKg: 1.8,
    packagingKg: 0.5,
    confidence: "Medium",
    assumptions: ["Assumes a cotton-heavy garment with standard dyeing and finishing.", "Packaging assumes one individual mailer or retail bag."],
  },
  {
    keywords: ["laptop", "notebook computer", "macbook", "chromebook"],
    label: "Laptop",
    materialKg: 52,
    manufacturingKg: 86,
    shippingKg: 14,
    packagingKg: 3,
    confidence: "Medium",
    assumptions: [
      "Electronics footprints are dominated by chip, battery, and assembly emissions.",
      "Estimate reflects a mainstream consumer laptop rather than a gaming workstation.",
    ],
  },
  {
    keywords: ["phone", "smartphone", "iphone", "android phone"],
    label: "Smartphone",
    materialKg: 18,
    manufacturingKg: 42,
    shippingKg: 6,
    packagingKg: 1,
    confidence: "Medium",
    assumptions: ["Assumes a current-generation smartphone with lithium-ion battery production.", "Estimate excludes downstream charging emissions after purchase."],
  },
  {
    keywords: ["desk chair", "office chair", "chair"],
    label: "Office Chair",
    materialKg: 12,
    manufacturingKg: 8,
    shippingKg: 7,
    packagingKg: 2.4,
    confidence: "Medium",
    assumptions: ["Assumes mixed plastic, foam, and steel construction.", "Shipping is elevated because the product is bulky even when flat-packed."],
  },
  {
    keywords: ["coffee maker", "blender", "toaster", "microwave"],
    label: "Small Appliance",
    materialKg: 10,
    manufacturingKg: 11,
    shippingKg: 5,
    packagingKg: 1.8,
    confidence: "Medium",
    assumptions: ["Assumes a compact household appliance with metal, plastic, and electronics.", "Estimate focuses on cradle-to-delivery impact only."],
  },
]

const SAMPLE_INPUTS = ["Plastic water bottle pack", "https://www.amazon.com/Reusable-Stainless-Water-Bottle/dp/example", "Cotton t-shirt"]

function parseProductInput(rawInput: string) {
  const trimmed = rawInput.trim()
  const isUrl = /^https?:\/\//i.test(trimmed)

  if (!isUrl) {
    return {
      searchText: trimmed,
      displayName: toTitleCase(trimmed),
      source: "Manual entry",
    }
  }

  try {
    const url = new URL(trimmed)
    const segments = url.pathname
      .split("/")
      .filter(Boolean)
      .filter((segment) => !["dp", "gp", "product"].includes(segment.toLowerCase()))

    const slug = segments.find((segment) => /[a-zA-Z]/.test(segment)) ?? url.hostname
    const cleanName = slug
      .replace(/[-_]+/g, " ")
      .replace(/[0-9]{4,}/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    return {
      searchText: cleanName || url.hostname,
      displayName: toTitleCase(cleanName || url.hostname.replace("www.", "")),
      source: `Parsed from ${url.hostname.replace("www.", "")}`,
    }
  } catch {
    return {
      searchText: trimmed,
      displayName: toTitleCase(trimmed),
      source: "Manual entry",
    }
  }
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function analyzeProduct(rawInput: string): AnalysisResult {
  const parsed = parseProductInput(rawInput)
  const normalized = parsed.searchText.toLowerCase()
  const profile = PRODUCT_PROFILES.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword))) ?? buildGenericProfile(normalized, parsed.displayName)

  const quantityMultiplier = normalized.match(/\b(pack|set|bundle|case)\b/) ? 1.25 : 1
  const overseasMultiplier = normalized.match(/\bimported|overseas|international\b/) ? 1.15 : 1
  const premiumPackagingMultiplier = normalized.match(/\bglass|gift|premium\b/) ? 1.1 : 1

  const materialKg = round(profile.materialKg * quantityMultiplier, 1)
  const manufacturingKg = round(profile.manufacturingKg * quantityMultiplier, 1)
  const shippingKg = round(profile.shippingKg * quantityMultiplier * overseasMultiplier, 1)
  const packagingKg = round(profile.packagingKg * quantityMultiplier * premiumPackagingMultiplier, 1)

  const estimatedKg = round(materialKg + manufacturingKg + shippingKg + packagingKg, 1)
  const contributors: Contributor[] = [
    {
      label: "Materials",
      value: materialKg,
      detail: "Raw inputs and extraction needed for the product itself.",
    },
    {
      label: "Manufacturing",
      value: manufacturingKg,
      detail: "Factory energy use, assembly, and processing emissions.",
    },
    {
      label: "Shipping",
      value: shippingKg,
      detail: "Transportation from production to warehouse and final market.",
    },
    {
      label: "Packaging",
      value: packagingKg,
      detail: "Boxes, wraps, inserts, and retail-ready packaging materials.",
    },
  ].sort((left, right) => right.value - left.value)

  const topDrivers = contributors
    .slice(0, 2)
    .map((entry) => entry.label.toLowerCase())
    .join(" and ")

  const assumptions = [`${parsed.source}.`, ...profile.assumptions, "This is a prototype estimate for awareness, not a certified lifecycle assessment."]

  return {
    displayName: parsed.displayName || profile.label,
    estimatedKg,
    confidence: profile.confidence,
    summary: `Estimated footprint is driven mostly by ${topDrivers}.`,
    assumptions,
    contributors,
  }
}

function buildGenericProfile(normalizedInput: string, displayName: string): ProductProfile {
  const lengthScore = clamp(normalizedInput.length / 18, 0.8, 1.6)
  const hasElectronics = /\bcharger|device|speaker|headphones|monitor|tablet\b/.test(normalizedInput)
  const hasFurniture = /\btable|desk|dresser|cabinet|shelf\b/.test(normalizedInput)
  const hasReusable = /\breusable|steel|metal|glass|durable\b/.test(normalizedInput)

  let materialKg = 4.2 * lengthScore
  let manufacturingKg = 3.4 * lengthScore
  let shippingKg = 2.3 * lengthScore
  let packagingKg = 0.9 * lengthScore
  let confidence: AnalysisResult["confidence"] = "Exploratory"

  if (hasElectronics) {
    materialKg += 9
    manufacturingKg += 16
    shippingKg += 3
    packagingKg += 0.6
    confidence = "Medium"
  }

  if (hasFurniture) {
    materialKg += 12
    manufacturingKg += 7
    shippingKg += 8
    packagingKg += 2.2
    confidence = "Medium"
  }

  if (hasReusable) {
    materialKg += 2
    packagingKg -= 0.2
  }

  return {
    keywords: [],
    label: displayName,
    materialKg: round(materialKg, 1),
    manufacturingKg: round(manufacturingKg, 1),
    shippingKg: round(shippingKg, 1),
    packagingKg: round(Math.max(packagingKg, 0.3), 1),
    confidence,
    assumptions: [
      "Used a category-free estimate because the product did not match a known template yet.",
      "Heuristics scale based on likely complexity, size cues, and product language in the input.",
    ],
  }
}

function round(value: number, precision: number) {
  const multiplier = 10 ** precision
  return Math.round(value * multiplier) / multiplier
}

export default function Popup() {
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(() => analyzeProduct("Plastic water bottle pack"))

  function handleAnalyze() {
    if (!input.trim()) {
      setError("Enter a product name or paste a product link to estimate its footprint.")
      return
    }

    setError("")
    setResult(analyzeProduct(input))
  }

  return (
    <div className="popup-shell">
      <div className="popup-card">
        <div className="hero-block">
          <p className="eyebrow">Core Feature 1</p>
          <h1>EcoOffset AI</h1>
          <p className="hero-copy">Estimate a product&apos;s carbon footprint from a name or shopping link, then break down what likely drives the impact.</p>
        </div>

        <div className="input-panel">
          <label className="input-label" htmlFor="product-input">
            Product name or URL
          </label>
          <textarea
            id="product-input"
            className="product-input"
            placeholder="Paste an Amazon link or type something like 'cotton t-shirt'"
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="actions-row">
            <button className="primary-button" onClick={handleAnalyze} type="button">
              Analyze Product
            </button>
            <span className="helper-text">Works with names and product links.</span>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="sample-row">
            {SAMPLE_INPUTS.map((sample) => (
              <button
                key={sample}
                className="sample-chip"
                onClick={() => {
                  setInput(sample)
                  setError("")
                }}
                type="button"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {result ? (
          <div className="results-panel">
            <div className="results-header">
              <div>
                <p className="section-label">Estimated Impact</p>
                <h2>{result.displayName}</h2>
              </div>
              <span className={`confidence-badge confidence-${result.confidence.toLowerCase()}`}>{result.confidence} confidence</span>
            </div>

            <div className="impact-band">
              <div>
                <p className="impact-number">{result.estimatedKg} kg CO2e</p>
                <p className="impact-copy">{result.summary}</p>
              </div>
            </div>

            <div className="contributors-list">
              {result.contributors.map((contributor) => (
                <div className="contributor-card" key={contributor.label}>
                  <div className="contributor-topline">
                    <span>{contributor.label}</span>
                    <strong>{contributor.value} kg</strong>
                  </div>
                  <p>{contributor.detail}</p>
                </div>
              ))}
            </div>

            <div className="assumptions-card">
              <p className="section-label">Assumptions</p>
              <ul>
                {result.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
