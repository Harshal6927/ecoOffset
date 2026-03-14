import type { EmissionsValue, OffsetSuggestionResult } from "./types.ts"

// Approximate kilograms of CO2e a single tree can offset over time.
export const KG_CO2E_OFFSET_PER_TREE = 21
const KG_PER_VERIFIED_CARBON_CREDIT = 1000

function formatTreeRange(treeCount: number) {
  const minimumTrees = Math.max(1, Math.floor(treeCount))
  const maximumTrees = Math.max(minimumTrees, Math.ceil(treeCount))

  if (minimumTrees === maximumTrees) {
    return `${minimumTrees} tree${minimumTrees === 1 ? "" : "s"}`
  }

  return `${minimumTrees}-${maximumTrees} trees`
}

function formatCarbonCreditTons(emissionsKg: number) {
  const tons = emissionsKg / KG_PER_VERIFIED_CARBON_CREDIT

  if (tons >= 0.1) {
    return `${tons.toFixed(1).replace(/\.0$/, "")} tCO2e`
  }

  return `${tons.toFixed(2)} tCO2e`
}

export function getOffsetSuggestions(emissionsKg: EmissionsValue): OffsetSuggestionResult | null {
  const safeEmissionsKg = Number(emissionsKg)

  if (!Number.isFinite(safeEmissionsKg) || safeEmissionsKg <= 0) {
    return null
  }

  const estimatedTrees = safeEmissionsKg / KG_CO2E_OFFSET_PER_TREE
  const treeRange = formatTreeRange(estimatedTrees)
  const carbonCreditsTons = formatCarbonCreditTons(safeEmissionsKg)

  return {
    emissionsKg: safeEmissionsKg,
    treeRange,
    carbonCreditsTons,
    suggestions: [
      {
        id: "trees",
        label: `Plant ${treeRange}`,
        detail: `A rough tree-based equivalent for balancing about ${safeEmissionsKg} kg CO2e over time.`,
      },
      {
        id: "reforestation",
        label: "Support a reforestation project",
        detail: `Look for a project sized to remove roughly ${carbonCreditsTons} over time, not just a generic donation.`,
      },
      {
        id: "credits",
        label: `Purchase about ${carbonCreditsTons} in verified carbon credits`,
        detail: `Choose independently verified credits that explicitly cover about ${carbonCreditsTons}.`,
      },
    ],
  }
}
