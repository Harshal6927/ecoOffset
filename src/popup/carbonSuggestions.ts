export type EmissionsValue = number | null | undefined

export type OffsetSuggestion = {
  id: string
  label: string
}

export type OffsetSuggestionResult = {
  emissionsKg: number
  treeRange: string
  suggestions: OffsetSuggestion[]
}

// Approximate kilograms of CO2e a single tree can offset over its lifetime.
export const KG_CO2E_OFFSET_PER_TREE = 21

function formatTreeRange(treeCount: number) {
  const minimumTrees = Math.max(1, Math.floor(treeCount))
  const maximumTrees = Math.max(minimumTrees, Math.ceil(treeCount))

  if (minimumTrees === maximumTrees) {
    return `${minimumTrees} tree${minimumTrees === 1 ? "" : "s"}`
  }

  return `${minimumTrees}-${maximumTrees} trees`
}

export function getOffsetSuggestions(emissionsKg: EmissionsValue): OffsetSuggestionResult | null {
  if (!Number.isFinite(emissionsKg) || emissionsKg <= 0) {
    return null
  }

  const estimatedTrees = emissionsKg / KG_CO2E_OFFSET_PER_TREE
  const treeRange = formatTreeRange(estimatedTrees)

  return {
    emissionsKg,
    treeRange,
    suggestions: [
      {
        id: "trees",
        label: `Plant ${treeRange}`,
      },
      {
        id: "reforestation",
        label: "Support a reforestation project",
      },
      {
        id: "credits",
        label: "Purchase verified carbon credits",
      },
    ],
  }
}
