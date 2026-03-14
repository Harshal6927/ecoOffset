import { useState } from "react"
import { analyzeProductCarbonImpact, extractProductTitleFromUrl, type ProductCarbonAnalysisResult } from "./productCarbonAnalysis"

type ValidationState = {
  message: string
  tone: "error" | "neutral" | "empty"
} | null

const confidenceStyles: Record<ProductCarbonAnalysisResult["confidence"], string> = {
  high: "border-[#63c786] bg-[#e8f8ee] text-[#155b35]",
  medium: "border-[#e7b85f] bg-[#fff6df] text-[#8a4f08]",
  low: "border-[#bcc7c2] bg-[#f3f5f4] text-[#4f5d57]",
}

export default function Popup() {
  const [productUrl, setProductUrl] = useState("")
  const [productName, setProductName] = useState("")
  const [validation, setValidation] = useState<ValidationState>(null)
  const [result, setResult] = useState<ProductCarbonAnalysisResult | null>(null)

  function isProbablyUrl(value: string) {
    if (!value.trim()) {
      return true
    }

    try {
      // Normalizing missing schemes keeps lightweight pasted links working.
      const normalizedValue = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
      const url = new URL(normalizedValue)
      return Boolean(url.hostname)
    } catch {
      return false
    }
  }

  function handleAnalyze() {
    const trimmedUrl = productUrl.trim()
    const trimmedName = productName.trim()

    if (!trimmedUrl && !trimmedName) {
      setValidation({
        message: "Add a product URL or type a product name to run an estimate.",
        tone: "error",
      })
      setResult(null)
      return
    }

    if (trimmedUrl && !isProbablyUrl(trimmedUrl)) {
      setValidation({
        message: "That URL does not look valid yet. Paste a product link or use the product name field.",
        tone: "error",
      })
      setResult(null)
      return
    }

    if (!trimmedUrl && trimmedName.length < 3) {
      setValidation({
        message: "Add a more descriptive product name so the estimate has enough context.",
        tone: "error",
      })
      setResult(null)
      return
    }

    const extractedTitle = extractProductTitleFromUrl(trimmedUrl)
    const analysisResult = analyzeProductCarbonImpact({
      productUrl: trimmedUrl,
      productName: trimmedName,
    })

    if (!analysisResult) {
      setValidation({
        message: "We could not identify the product. Try a clearer product name or URL.",
        tone: "error",
      })
      setResult(null)
      return
    }

    setResult(analysisResult)
    setValidation({
      message: extractedTitle ? `Analyzed using URL title match: ${extractedTitle}` : "Analyzed using the typed product name and rule-based product heuristics.",
      tone: trimmedUrl || trimmedName ? "neutral" : "empty",
    })
  }

  return (
    <div className="w-[380px] bg-[radial-gradient(circle_at_top,_#f0fff6,_#edf6f1_45%,_#e4efe8)] p-5 font-sans text-[#1f2937]">
      <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_rgba(37,83,61,0.12)] backdrop-blur">
        <div className="rounded-2xl bg-[linear-gradient(135deg,_#1f6b4f,_#3e9b74)] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-white/75">EcoOffset</p>
          <h1 className="mt-2 mb-0 text-2xl font-semibold">Product Carbon Analysis</h1>
          <p className="mt-2 mb-0 text-sm leading-5 text-white/80">Paste a product link or type a product name for a fast, frontend-only estimate.</p>
        </div>

        <section className="mt-4 rounded-2xl border border-[#d9e6df] bg-white p-4 shadow-sm">
          <label className="block text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]" htmlFor="product-url">
            Product URL
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-[#cfe0d7] bg-[#fbfefd] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#90a39a] focus:border-[#3f8f6b] focus:ring-2 focus:ring-[#dcefe5]"
            id="product-url"
            onChange={(event) => setProductUrl(event.target.value)}
            placeholder="https://www.amazon.com/..."
            type="text"
            value={productUrl}
          />

          <label className="mt-4 block text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]" htmlFor="product-name">
            Product Name
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-[#cfe0d7] bg-[#fbfefd] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#90a39a] focus:border-[#3f8f6b] focus:ring-2 focus:ring-[#dcefe5]"
            id="product-name"
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Reusable stainless steel water bottle"
            type="text"
            value={productName}
          />

          <div className="mt-4 flex items-center gap-2">
            <button
              className="flex-1 rounded-xl bg-[linear-gradient(135deg,_#1f6b4f,_#2d8a61)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,107,79,0.24)] transition hover:brightness-105"
              onClick={handleAnalyze}
              type="button"
            >
              Analyze Product
            </button>
          </div>

          {validation ? (
            <p
              className={`mt-3 mb-0 rounded-xl px-3 py-2.5 text-sm leading-5 ${
                validation.tone === "error" ? "border border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]" : "border border-[#d5eadf] bg-[#eef8f2] text-[#256347]"
              }`}
            >
              {validation.message}
            </p>
          ) : null}
        </section>

        {result ? (
          <section className="mt-4 rounded-2xl border border-[#d9e6df] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]">Analysis result</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${confidenceStyles[result.confidence]}`}>{result.confidence} confidence</span>
            </div>

            <div className="mt-4 rounded-2xl bg-[linear-gradient(180deg,_#f8fcf9,_#eef6f1)] p-4">
              <p className="m-0 text-sm font-semibold text-[#163327]">
                Product: <span className="font-medium text-[#1f2937]">{result.productName}</span>
              </p>
              <p className="mt-2 mb-0 text-sm font-semibold text-[#163327]">
                Estimated Carbon Impact: <span className="text-base text-[#1f6b4f]">{result.estimatedKgCO2e} kg CO2e</span>
              </p>

              <div className="mt-4">
                <p className="m-0 text-sm font-semibold text-[#163327]">Major contributors:</p>
                <ul className="mt-2 mb-0 list-disc space-y-2 pl-5 text-sm leading-5 text-[#374151]">
                  {result.contributors.map((contributor) => (
                    <li key={contributor}>{contributor}</li>
                  ))}
                </ul>
              </div>
            </div>

            <details className="mt-4 rounded-xl border border-[#dfe9e3] bg-[#fbfdfc] px-3 py-2">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[#25543f]">How this estimate was calculated</summary>
              <div className="mt-3 space-y-3 text-sm leading-5 text-[#55636f]">
                <p className="m-0">
                  We combine a category baseline with additive adjustments for materials, manufacturing intensity, shipping distance, packaging, and whether the item appears
                  single-use or reusable.
                </p>
                <ul className="m-0 list-disc space-y-2 pl-5">
                  {result.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
                <p className="m-0 text-xs text-[#6b7280]">This is a lightweight heuristic estimate for demo use, not a product-specific life-cycle assessment.</p>
              </div>
            </details>
          </section>
        ) : (
          <section className="mt-4 rounded-2xl border border-dashed border-[#c9ddd2] bg-white/70 p-4 text-sm text-[#5b6b63]">
            <p className="m-0 font-semibold text-[#244a3a]">No analysis yet</p>
            <p className="mt-2 mb-0 leading-5">
              Try a product like <span className="font-medium">plastic bottle pack</span>, <span className="font-medium">stainless steel bottle</span>, or{" "}
              <span className="font-medium">polyester hoodie</span> to see how the estimate changes.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
