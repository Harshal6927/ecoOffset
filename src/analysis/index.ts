/**
 * Analysis service interface.
 *
 * This is the seam where LLM integration plugs in.
 * The current implementation (mock.ts) uses keyword-based heuristics.
 * A future implementation can call an LLM API and return real data
 * without any other files needing to change.
 */
import type { AnalysisResult, Product } from "../types"

export interface AnalysisService {
  /**
   * Analyses a product and returns its environmental impact, eco-friendly
   * alternatives, and actionable tips.
   *
   * @param product - The detected product to analyse.
   * @returns A resolved `AnalysisResult`. Implementations should reject only
   *   on unrecoverable errors (e.g. network failure); callers in the content
   *   script do not currently handle rejected promises.
   */
  analyze(product: Product): Promise<AnalysisResult>
}
