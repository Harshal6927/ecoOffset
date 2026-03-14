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

/**
 * Environmental impact scores for a product.
 * Scores are 0–100 where lower is better (less environmental impact).
 */
export interface EcoImpact {
  /** Carbon footprint score (0 = minimal, 100 = very high). */
  carbonScore: number
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
