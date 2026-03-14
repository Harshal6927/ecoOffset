import { type ChangeEvent, type FormEvent, useState } from "react"
import { getOffsetSuggestions } from "./carbonSuggestions"
import { analyzeProductCarbonImpact, extractProductTitleFromUrl, isProbablyUrl, type ProductCarbonAnalysisResult } from "./productCarbonAnalysis"

const confidenceStyles: Record<ProductCarbonAnalysisResult["confidence"], string> = {
  high: "border-[#63c786] bg-[#e8f8ee] text-[#155b35]",
  medium: "border-[#e7b85f] bg-[#fff6df] text-[#8a4f08]",
  low: "border-[#bcc7c2] bg-[#f3f5f4] text-[#4f5d57]",
}

export default function Popup() {
  const [productInput, setProductInput] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [result, setResult] = useState<ProductCarbonAnalysisResult | null>(null)

  const trimmedInput = productInput.trim()
  const looksLikeUrl = isProbablyUrl(trimmedInput)
  const productUrl = trimmedInput && looksLikeUrl ? trimmedInput : ""
  const productName = trimmedInput && !looksLikeUrl ? trimmedInput : ""
  const hasInput = Boolean(trimmedInput)
  const offsetResult = result ? getOffsetSuggestions(result.estimatedKgCO2e) : null

  function resetOutput() {
    setErrorMessage(null)
    setResult(null)
  }

  function handleProductInputChange(event: ChangeEvent<HTMLInputElement>) {
    setProductInput(event.target.value)
    resetOutput()
  }

  function handleReset() {
    setProductInput("")
    resetOutput()
  }

  async function handleEstimate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedInput) {
      setErrorMessage("Enter a product link or a product name to estimate its footprint.")
      setResult(null)
      return
    }

    const extractedTitle = productUrl ? extractProductTitleFromUrl(productUrl) : null

    if (productUrl && !extractedTitle) {
      setErrorMessage("That link does not expose a readable product title yet. Paste a product name instead or use a more specific product page URL.")
      setResult(null)
      return
    }

    if (productName && productName.length < 3) {
      setErrorMessage("Add a more descriptive product name so the estimate has enough context.")
      setResult(null)
      return
    }

    setErrorMessage(null)
    setIsEstimating(true)
    setResult(null)

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })

    const analysisResult = analyzeProductCarbonImpact({ productName, productUrl })

    setIsEstimating(false)

    if (!analysisResult) {
      setErrorMessage("We could not identify the product confidently. Try adding a clearer product name alongside the link.")
      setResult(null)
      return
    }

    setResult(analysisResult)
  }

  return (
    <div className="w-full max-w-[392px] bg-[radial-gradient(circle_at_top,_#f0fff6,_#edf6f1_45%,_#e4efe8)] p-3 font-sans text-[#1f2937] sm:p-5">
      <div className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_60px_rgba(37,83,61,0.12)] backdrop-blur sm:p-5">
        <header className="rounded-2xl bg-[linear-gradient(135deg,_#1f6b4f,_#3e9b74)] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-white/75">EcoOffset</p>
          <h1 className="mt-2 mb-0 text-[1.55rem] font-semibold leading-8">Estimate a product footprint</h1>
          <p className="mt-2 mb-0 text-sm leading-5 text-white/80">
            Use a product link or name to estimate emissions, then review simple offset actions and the assumptions behind the number.
          </p>
        </header>

        <form aria-busy={isEstimating} className="mt-4 rounded-2xl border border-[#d9e6df] bg-white p-4 shadow-sm" onSubmit={handleEstimate}>
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]">Product details</p>
          <p className="mt-2 mb-0 text-sm leading-5 text-[#55636f]">Paste a product page URL or type a product name. We will interpret it automatically.</p>

          <div className="mt-4">
            <label className="block text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]" htmlFor="product-input">
              Product link or name
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-[#cfe0d7] bg-[#fbfefd] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#90a39a] focus:border-[#3f8f6b] focus:ring-2 focus:ring-[#dcefe5]"
              id="product-input"
              onChange={handleProductInputChange}
              placeholder="Paste a URL or type a product name"
              type="text"
              value={productInput}
            />
            <p className="mt-2 mb-0 text-xs leading-5 text-[#66766f]">Helpful product-name clues: material, pack size, imported or local, refillable, fragile.</p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              className="flex-1 rounded-xl bg-[linear-gradient(135deg,_#1f6b4f,_#2d8a61)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,107,79,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isEstimating || !hasInput}
              type="submit"
            >
              {isEstimating ? "Estimating..." : "Estimate footprint"}
            </button>
            <button
              className="rounded-xl border border-[#d5e4db] bg-white px-4 py-2.5 text-sm font-semibold text-[#2c5b45] transition hover:border-[#b7d4c6] hover:bg-[#f7fbf8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isEstimating || (!hasInput && !result)}
              onClick={handleReset}
              type="button"
            >
              Reset
            </button>
          </div>

          {isEstimating ? (
            <p className="mt-3 mb-0 rounded-xl border border-[#d8e7df] bg-[#f3faf6] px-3 py-2.5 text-sm leading-5 text-[#25543f]">
              Reviewing the product text for category, material, shipping, and packaging cues.
            </p>
          ) : null}

          {errorMessage ? <p className="mt-3 mb-0 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2.5 text-sm leading-5 text-[#b91c1c]">{errorMessage}</p> : null}
        </form>

        {result ? (
          <>
            <section className="mt-4 rounded-2xl border border-[#d9e6df] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]">Estimate</p>
                  <h2 className="mt-2 mb-0 text-lg font-semibold leading-6 text-[#163327]">{result.productName}</h2>
                  <p className="mt-2 mb-0 text-sm leading-5 text-[#55636f]">{result.sourceSummary}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${confidenceStyles[result.confidence]}`}>{result.confidence} confidence</span>
              </div>

              <div className="mt-4 rounded-2xl bg-[linear-gradient(180deg,_#f8fcf9,_#eef6f1)] p-4">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#4d7c68]">Estimated impact</p>
                <p className="mt-2 mb-0 text-[1.85rem] font-semibold leading-8 text-[#1f6b4f]">{result.estimatedKgCO2e} kg CO2e</p>
                <p className="mt-2 mb-0 text-sm leading-5 text-[#55636f]">Built from category, material, manufacturing, shipping, and packaging heuristics.</p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-[#dce9df] bg-[#f6fbf8] p-3">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#52796f]">Major contributors</p>
                  <ul className="mt-3 mb-0 list-disc space-y-2 pl-5 text-sm leading-5 text-[#374151]">
                    {result.contributors.map((contributor) => (
                      <li key={contributor}>{contributor}</li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-2xl border border-[#dce9df] bg-[#f6fbf8] p-3">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#52796f]">Assumptions</p>
                  <ul className="mt-3 mb-0 list-disc space-y-2 pl-5 text-sm leading-5 text-[#374151]">
                    {result.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <article className="mt-4 rounded-2xl border border-[#dce9df] bg-[#f6fbf8] p-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#52796f]">Estimation method</p>
                <p className="mt-2 mb-0 text-sm leading-5 text-[#55636f]">Where the carbon number comes from in this demo:</p>
                <ul className="mt-3 mb-0 list-disc space-y-2 pl-5 text-sm leading-5 text-[#374151]">
                  {result.methodology.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="mt-4 rounded-2xl border border-[#dce9df] bg-[#f6fbf8] p-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#52796f]">Lower-impact comparison</p>
                <ul className="mt-3 mb-0 list-disc space-y-2 pl-5 text-sm leading-5 text-[#374151]">
                  {result.impactComparisons.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>

            {offsetResult ? (
              <section className="mt-4 rounded-2xl border border-[#d9e6df] bg-white p-4 shadow-sm">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#52796f]">Offset ideas</p>
                <p className="mt-2 mb-0 text-sm leading-5 text-[#55636f]">To offset this purchase, you could:</p>

                <ul className="mt-4 mb-0 list-disc space-y-3 pl-5 text-sm leading-5 text-[#374151]">
                  {offsetResult.suggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <span className="font-semibold text-[#163327]">{suggestion.label}</span>
                      <p className="mt-1 mb-0 text-sm leading-5 text-[#55636f]">{suggestion.detail}</p>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 mb-0 text-xs leading-5 text-[#66766f]">
                  These are rough equivalents. Real project impact depends on the provider, verification standard, and how long the carbon stays stored.
                </p>
              </section>
            ) : null}
          </>
        ) : (
          <section className="mt-4 rounded-2xl border border-dashed border-[#c9ddd2] bg-white/70 p-4 text-sm text-[#5b6b63]">
            <p className="m-0 font-semibold text-[#244a3a]">Start with one product</p>
            <p className="mt-2 mb-0 leading-5">Enter a link or product name to see the estimated footprint, the biggest drivers, and simple offset actions.</p>
          </section>
        )}
      </div>
    </div>
  )
}
