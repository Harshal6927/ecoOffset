import { type FormEvent, useState } from "react"

type ProductProfile = {
  alternative: string
  alternativeReduction: number
  checkoutOffset: number
  contributors: string[]
  estimateKg: number
  label: string
  offsetIdeas: string[]
  query: string
}

const PRODUCT_LIBRARY: ProductProfile[] = [
  {
    query: "plastic water bottle pack",
    label: "Plastic Water Bottle Pack",
    estimateKg: 8.2,
    contributors: ["Virgin plastic manufacturing", "Overseas shipping", "Single-use shrink wrap"],
    offsetIdeas: ["Plant 4-5 trees through a reforestation project", "Add $1.40 in verified carbon credits", "Switch the next order to a refillable option"],
    alternative: "Recycled plastic bottle pack",
    alternativeReduction: 35,
    checkoutOffset: 1,
  },
  {
    query: "running shoes",
    label: "Performance Running Shoes",
    estimateKg: 13.6,
    contributors: ["Foam and rubber production", "Multi-country assembly", "Air-freight delivery"],
    offsetIdeas: ["Fund mangrove restoration for one week of emissions", "Bundle shipping with other purchases", "Choose a take-back brand next time"],
    alternative: "Running shoes with recycled knit uppers",
    alternativeReduction: 29,
    checkoutOffset: 2,
  },
  {
    query: "wireless headphones",
    label: "Wireless Headphones",
    estimateKg: 16.4,
    contributors: ["Battery manufacturing", "Aluminum and plastic housing", "Retail packaging"],
    offsetIdeas: ["Support a renewable energy offset project", "Buy refurbished when the feature set allows", "Keep the device longer with repair coverage"],
    alternative: "Refurbished wireless headphones",
    alternativeReduction: 41,
    checkoutOffset: 2,
  },
]

const keywordProfiles = [
  {
    keywords: ["bottle", "plastic", "pack"],
    profile: PRODUCT_LIBRARY[0],
  },
  {
    keywords: ["shoe", "sneaker", "running"],
    profile: PRODUCT_LIBRARY[1],
  },
  {
    keywords: ["headphone", "earbud", "speaker"],
    profile: PRODUCT_LIBRARY[2],
  },
]

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

function createFallbackProfile(query: string): ProductProfile {
  const normalized = query.toLowerCase().trim()
  const wordCount = normalized.split(/\s+/).filter(Boolean).length
  const shippingFactor = normalized.includes("amazon") || normalized.includes("http") ? 2.4 : 1.2
  const packagingFactor = normalized.includes("pack") ? 1.4 : 0.8
  const estimateKg = Number((4.2 + wordCount * 1.3 + shippingFactor + packagingFactor).toFixed(1))

  return {
    query: normalized,
    label: titleCase(normalized || "Everyday Product"),
    estimateKg,
    contributors: ["Material extraction and processing", "Manufacturing energy use", "Shipping and packaging"],
    offsetIdeas: [
      `Plant ${Math.max(2, Math.round(estimateKg / 2))} trees with a verified partner`,
      `Contribute $${Math.max(1, Math.round(estimateKg * 0.18))} to certified carbon credits`,
      "Look for a longer-lasting or recycled-material version",
    ],
    alternative: `Lower-impact ${normalized || "product"} option`,
    alternativeReduction: 24,
    checkoutOffset: Math.max(1, Math.round(estimateKg * 0.12)),
  }
}

function estimateProduct(query: string) {
  const normalized = query.toLowerCase().trim()
  const matchedProfile = keywordProfiles.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)))?.profile

  if (matchedProfile) {
    return {
      ...matchedProfile,
      label: normalized.includes("amazon") || normalized.includes("http") ? matchedProfile.label : titleCase(normalized),
    }
  }

  return createFallbackProfile(normalized)
}

export default function Popup() {
  const [query, setQuery] = useState("Plastic water bottle pack")
  const [result, setResult] = useState<ProductProfile>(PRODUCT_LIBRARY[0])

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(estimateProduct(query))
  }

  return (
    <div className="popup-shell">
      <div className="popup-card">
        <div className="hero-panel">
          <p className="eyebrow">EcoOffset AI</p>
          <h1>Turn product emissions into an action plan.</h1>
          <p className="hero-copy">
            Estimate the carbon impact of a product, translate it into simple offset actions, and show a lower-impact alternative without blocking the purchase.
          </p>
          <div className="hero-metrics">
            <div>
              <strong>8.2 kg</strong>
              <span>sample CO2 estimate</span>
            </div>
            <div>
              <strong>$1 offset</strong>
              <span>checkout-ready add-on</span>
            </div>
          </div>
        </div>

        <form className="analysis-panel" onSubmit={handleAnalyze}>
          <label className="field-label" htmlFor="product-query">
            Paste a product link or describe the item
          </label>
          <textarea
            id="product-query"
            className="query-input"
            rows={3}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Amazon link, product page, or product name"
          />

          <div className="sample-row">
            {PRODUCT_LIBRARY.map((product) => (
              <button key={product.query} className="sample-chip" type="button" onClick={() => setQuery(product.label)}>
                {product.label}
              </button>
            ))}
          </div>

          <button className="analyze-button" type="submit">
            Analyze impact
          </button>
        </form>

        <section className="result-panel" aria-live="polite">
          <div className="result-header">
            <div>
              <p className="section-label">Estimated footprint</p>
              <h2>{result.label}</h2>
            </div>
            <div className="impact-pill">{result.estimateKg} kg CO2</div>
          </div>

          <div className="result-grid">
            <article className="info-card">
              <p className="section-label">Major contributors</p>
              <ul>
                {result.contributors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="info-card">
              <p className="section-label">Offset suggestions</p>
              <ul>
                {result.offsetIdeas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="alternative-card">
            <div>
              <p className="section-label">Smarter alternative</p>
              <h3>{result.alternative}</h3>
              <p>Estimated reduction: {result.alternativeReduction}% lower footprint</p>
            </div>
            <div className="reduction-pill">-{result.alternativeReduction}%</div>
          </div>

          <div className="checkout-card">
            <p className="section-label">Checkout use case</p>
            <p>
              This purchase generated <strong>{result.estimateKg} kg CO2</strong>. Add <strong>${result.checkoutOffset}</strong> to fund an instant offset.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
