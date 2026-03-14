/**
 * LLM-backed analysis service using Ollama (qwen3.5:4b).
 *
 * Calls the Ollama REST API directly via fetch — fully compatible with MV3
 * service workers (avoids Node.js API dependencies from the ollama npm package).
 *
 * This class throws on any error; the caller (background.ts) is responsible
 * for catching and falling back to MockAnalysisService.
 */
import type { Alternative, AnalysisResult, EcoImpact, Product } from "../types"
import type { AnalysisService } from "./index"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OLLAMA_URL = "http://localhost:11434/api/chat"
const MODEL = "qwen3.5:4b"

/** Abort the fetch after 300 s to avoid hanging the service worker indefinitely. */
const TIMEOUT_MS = 300000

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

/**
 * System prompt instructs the model to respond with a raw JSON object matching
 * the LlmJsonResponse shape. `/no_think` disables Qwen3's chain-of-thought mode
 * so the response contains only the JSON output.
 */
const SYSTEM_PROMPT = `You are an environmental impact analyst. Given a product name and shopping platform, analyse its sustainability and respond ONLY with a raw JSON object — no markdown, no explanation, no preamble.

The JSON must match this exact shape:
{
  "carbonScore": <integer 0-100, lower = lower carbon footprint>,
  "waterScore": <integer 0-100, lower = lower water usage>,
  "wasteScore": <integer 0-100, lower = less waste generated>,
  "summary": "<1-2 sentence factual summary of the product's main environmental impact>",
  "alternatives": [
    { "name": "<concise name of an eco-friendly alternative>", "reason": "<one sentence why it is more sustainable>" },
    { "name": "<concise name of an eco-friendly alternative>", "reason": "<one sentence why it is more sustainable>" },
    { "name": "<concise name of an eco-friendly alternative>", "reason": "<one sentence why it is more sustainable>" }
  ],
  "tips": [
    "<actionable sustainability tip 1>",
    "<actionable sustainability tip 2>",
    "<actionable sustainability tip 3>",
    "<actionable sustainability tip 4>"
  ]
}

Rules:
- Scores are integers 0-100. Lower means less environmental impact.
- Provide exactly 3 alternatives and exactly 4 tips.
- Be concise and factual. No filler phrases.
- Return only the raw JSON object. /no_think`

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/**
 * Raw JSON shape we expect from the LLM.
 * searchUrl is generated in code — we never ask the model to produce URLs
 * to avoid hallucinated links.
 */
interface LlmJsonResponse {
  carbonScore: number
  waterScore: number
  wasteScore: number
  summary: string
  alternatives: Array<{ name: string; reason: string }>
  tips: string[]
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Clamps `value` to [min, max] and rounds to the nearest integer.
 * Returns the midpoint if `value` cannot be parsed as a finite number.
 */
function clamp(value: unknown, min = 0, max = 100): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10)
  if (!Number.isFinite(n)) return Math.round((min + max) / 2)
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Strips `<think>…</think>` blocks emitted by Qwen3 thinking models before
 * the actual response content. The `/no_think` suffix in the system prompt
 * should prevent them, but this is a safety net.
 */
function stripThinkingTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
}

/**
 * Parses and validates the LLM JSON string into a full AnalysisResult.
 * Generates `searchUrl` values in code to guarantee working links.
 *
 * @throws {SyntaxError} if `raw` is not valid JSON after stripping think tags.
 */
function parseResponse(raw: string, product: Product): AnalysisResult {
  const cleaned = stripThinkingTags(raw)
  const data = JSON.parse(cleaned) as LlmJsonResponse

  const ecoImpact: EcoImpact = {
    carbonScore: clamp(data.carbonScore),
    waterScore: clamp(data.waterScore),
    wasteScore: clamp(data.wasteScore),
    summary: typeof data.summary === "string" && data.summary.trim().length > 0 ? data.summary.trim() : "Environmental impact data unavailable.",
  }

  const rawAlts = Array.isArray(data.alternatives) ? data.alternatives.slice(0, 3) : []
  const productSearchTerm = encodeURIComponent(product.name.slice(0, 60))

  // Build alternatives with code-generated searchUrls (never trust model-produced URLs)
  const alternatives: Alternative[] = rawAlts.map((alt) => ({
    name: typeof alt.name === "string" ? alt.name.trim() : "Eco-friendly alternative",
    reason: typeof alt.reason === "string" ? alt.reason.trim() : "",
    searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(((alt.name as string) ?? "").slice(0, 60))}+sustainable+eco`,
  }))

  // Prepend a direct eco search for the specific product being viewed
  alternatives.unshift({
    name: `Eco-friendly ${product.name.slice(0, 50)}`,
    reason: "Search for a certified sustainable version of this exact product.",
    searchUrl: `https://www.amazon.com/s?k=eco+friendly+sustainable+${productSearchTerm}`,
  })

  const tips: string[] = Array.isArray(data.tips)
    ? data.tips
        .slice(0, 4)
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim())
    : []

  return { product, ecoImpact, alternatives, tips }
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class LlmAnalysisService implements AnalysisService {
  async analyze(product: Product): Promise<AnalysisResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Product: "${product.name}" on ${product.platform}` },
          ],
          stream: false,
          format: "json",
          options: { temperature: 0.2 },
        }),
        signal: controller.signal,
      })

      if (response.status === 403) {
        throw new Error(
          "Ollama blocked the request (HTTP 403). chrome-extension:// origins are not in the default allow-list. " +
            'Fix: set OLLAMA_ORIGINS="*" before starting Ollama.',
        )
      }
      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}`)
      }

      const body = (await response.json()) as { message?: { content?: string } }
      const content = body?.message?.content

      if (typeof content !== "string" || content.trim().length === 0) {
        throw new Error("Ollama response missing message.content")
      }

      return parseResponse(content, product)
    } finally {
      clearTimeout(timer)
    }
  }
}
