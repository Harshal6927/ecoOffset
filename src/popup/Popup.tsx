import { getOffsetSuggestions } from "./carbonSuggestions"

type DemoPurchase = {
  label: string
  emissionsKg: number | null
}

export default function Popup() {
  const demoPurchase: DemoPurchase = {
    label: "Sample online purchase",
    emissionsKg: 95,
  }

  const offsetResult = getOffsetSuggestions(demoPurchase.emissionsKg)
  const emissionsLabel = Number.isFinite(demoPurchase.emissionsKg) ? `${demoPurchase.emissionsKg} kg CO2e` : "Emissions unavailable"

  return (
    <div className="w-[320px] p-5 font-sans text-[#1f2937]">
      <h1 className="m-0 text-center text-2xl font-semibold text-[#2d6a4f]">EcoOffset</h1>
      <p className="mt-2 mb-0 text-center text-sm text-[#55636f]">Simple ways to balance out a purchase&apos;s estimated footprint.</p>

      <section className="mt-5 rounded-2xl border border-[#d8e2dc] bg-[#f6fbf8] p-4 shadow-sm">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#52796f]">Carbon Offset Suggestions</p>
        <p className="mt-2 mb-0 text-sm text-[#55636f]">{demoPurchase.label}</p>
        <p className="mt-1 mb-0 text-lg font-semibold text-[#1b4332]">{emissionsLabel}</p>

        {offsetResult ? (
          <div className="mt-4 rounded-xl bg-white p-3">
            <p className="m-0 text-sm font-medium">To offset this purchase, you could:</p>
            <ul className="mt-3 mb-0 list-disc space-y-2 pl-5 text-sm text-[#374151]">
              {offsetResult.suggestions.map((suggestion) => (
                <li key={suggestion.id}>{suggestion.label}</li>
              ))}
            </ul>
            <p className="mt-3 mb-0 text-xs text-[#6b7280]">Tree estimate: {offsetResult.treeRange}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-white p-3">
            <p className="m-0 text-sm text-[#6b7280]">Offset suggestions will appear when valid emissions data is available.</p>
          </div>
        )}
      </section>
    </div>
  )
}
