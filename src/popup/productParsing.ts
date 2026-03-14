import type { ParsedProductInput, ProductCarbonAnalysisInput } from "./types.ts"

function titleCaseSlug(slug: string) {
  return slug
    .replace(/[-_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function normalizeProductUrl(productUrl: string) {
  const trimmedUrl = productUrl.trim()

  if (!trimmedUrl) {
    return ""
  }

  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
}

export function isProbablyUrl(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  if (/\s/.test(trimmedValue)) {
    return false
  }

  try {
    const normalizedValue = normalizeProductUrl(trimmedValue)
    const url = new URL(normalizedValue)
    const hostname = url.hostname.toLowerCase()
    const hasDomainLikeHost = hostname.includes(".") || hostname === "localhost" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)

    return hasDomainLikeHost
  } catch {
    return false
  }
}

export function extractProductTitleFromUrl(productUrl: string) {
  try {
    const normalizedUrl = normalizeProductUrl(productUrl)

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

    const readableTitle = titleCaseSlug(preferredSlug)
      .replace(/\bDp\b/g, "")
      .trim()

    return readableTitle || null
  } catch {
    return null
  }
}

export function parseProductInput(input: ProductCarbonAnalysisInput): ParsedProductInput | null {
  const normalizedUrl = normalizeProductUrl(input.productUrl)
  const providedName = input.productName.trim()
  const extractedTitle = extractProductTitleFromUrl(normalizedUrl)

  if (extractedTitle) {
    return {
      displayName: extractedTitle,
      extractedTitle,
      normalizedUrl,
      providedName,
      signalText: `${extractedTitle} ${providedName} ${normalizedUrl}`.toLowerCase().trim(),
      source: "url-title",
      sourceSummary: "Primary product name extracted from the pasted link, with your typed text used as extra context.",
    }
  }

  if (providedName) {
    return {
      displayName: providedName,
      extractedTitle: null,
      normalizedUrl,
      providedName,
      signalText: `${providedName} ${normalizedUrl}`.toLowerCase().trim(),
      source: "typed-name",
      sourceSummary: "Estimate based on the product name you entered and rule-based material, shipping, and packaging cues.",
    }
  }

  return null
}
