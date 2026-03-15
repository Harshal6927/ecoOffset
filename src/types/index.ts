/**
 * Core domain types for EcoOffset.
 * These types form the contract between the platform adapters,
 * the analysis service, and the UI layer.
 */

/** A product detected on a shopping page. */
export interface Product {
  /** Raw product name as extracted from the page. */
  name: string
  /** Platform identifier (e.g. "amazon", "ebay"). */
  platform: string
  /** Full URL of the product page. */
  url: string
}

/** Carbon footprint letter grade. A = best, D = worst. */
export type CarbonGrade = "A" | "B" | "C" | "D"

/**
 * Maps a kgCO2eq value to a letter grade.
 *
 * Thresholds:
 *   A: 0 – 5 kg    (very low footprint)
 *   B: > 5 – 15 kg (low footprint)
 *   C: > 15 – 30 kg (moderate footprint)
 *   D: > 30 kg      (high footprint)
 */
export function getCarbonGrade(kgCo2eq: number): CarbonGrade {
  if (kgCo2eq <= 5) return "A"
  if (kgCo2eq <= 15) return "B"
  if (kgCo2eq <= 30) return "C"
  return "D"
}

/**
 * Maps a CarbonGrade to a normalised 0–100 score for badge averaging.
 *
 *   A → 20  B → 40  C → 60  D → 80
 */
export function carbonGradeToScore(grade: CarbonGrade): number {
  const map: Record<CarbonGrade, number> = { A: 20, B: 40, C: 60, D: 80 }
  return map[grade]
}

/**
 * Environmental impact metrics for a product.
 * carbonKgCo2eq is a positive decimal (kg CO2 equivalent, lower is better).
 * waterScore and wasteScore are integers 0–100 (lower is better).
 */
export interface EcoImpact {
  /** Estimated carbon footprint in kg CO2 equivalent (lower is better). */
  carbonKgCo2eq: number
  /** Water usage score (0 = minimal, 100 = very high). */
  waterScore: number
  /** Waste generation score (0 = minimal, 100 = very high). */
  wasteScore: number
  /** Human-readable summary of the environmental impact. */
  summary: string
}

/** An eco-friendly alternative product suggestion. */
export interface Alternative {
  /** Display name of the alternative. */
  name: string
  /** Reason why this alternative is more eco-friendly. */
  reason: string
  /** Pre-filled search URL so the user can find it immediately. */
  searchUrl: string
}

/** Full analysis result for a detected product. */
export interface AnalysisResult {
  /** The product that was analysed. */
  product: Product
  ecoImpact: EcoImpact
  /** Eco-friendly alternative product suggestions. */
  alternatives: Alternative[]
  /** Actionable tips to reduce the product's environmental impact. */
  tips: string[]
}

/**
 * Message types for communication between the content script
 * and the background service worker.
 * Designed to be extended for future LLM API integration.
 */
export type MessageType = "ANALYZE_PRODUCT" | "ANALYSIS_RESULT" | "ERROR"

/**
 * Discriminated union base type for chrome.runtime messages.
 * Use the specific sub-types below when sending/receiving messages.
 */
export interface ExtensionMessage {
  type: MessageType
  payload: unknown
}

/** Sent by the content script to request analysis of a detected product. */
export interface AnalyzeProductMessage extends ExtensionMessage {
  type: "ANALYZE_PRODUCT"
  payload: Product
}

/** Sent by the background worker in response to ANALYZE_PRODUCT. */
export interface AnalysisResultMessage extends ExtensionMessage {
  type: "ANALYSIS_RESULT"
  payload: AnalysisResult
}

/** Sent when any handler encounters an unrecoverable error. */
export interface ErrorMessage extends ExtensionMessage {
  type: "ERROR"
  payload: { message: string }
}
