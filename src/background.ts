/**
 * Background service worker.
 *
 * Handles ANALYZE_PRODUCT messages from content scripts by calling the
 * LLM-backed analysis service (Ollama / qwen3.5:4b running locally).
 * Falls back to the keyword-heuristic MockAnalysisService if Ollama is
 * unreachable or returns an invalid response.
 *
 * Analysis runs here (not in the content script) because:
 *  - Content scripts are subject to the page's CSP, which blocks localhost fetches.
 *  - The background worker can maintain a shared response cache across all tabs.
 *
 * Message protocol is defined in src/types/index.ts.
 */
import { LlmAnalysisService } from "./analysis/llm"
import { MockAnalysisService } from "./analysis/mock"
import type { AnalyzeProductMessage, ExtensionMessage } from "./types"

// ---------------------------------------------------------------------------
// Service instances (shared across all messages for the worker's lifetime)
// ---------------------------------------------------------------------------

const llmService = new LlmAnalysisService()
const mockService = new MockAnalysisService()

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[EcoOffset] Extension installed.")
  } else if (details.reason === "update") {
    console.log(`[EcoOffset] Extension updated to v${chrome.runtime.getManifest().version}.`)
  }
})

// ---------------------------------------------------------------------------
// Keep the service worker alive during LLM inference (Chrome MV3 workaround).
// Ollama inference can take up to 60 s; without this alarm Chrome may suspend
// the worker mid-request and the sendResponse callback will never fire.
// ---------------------------------------------------------------------------

chrome.alarms.create("keepAlive", { periodInMinutes: 0.4 })
chrome.alarms.onAlarm.addListener(() => {
  // No-op — the alarm firing is enough to keep the service worker alive.
})

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response: ExtensionMessage) => void) => {
  if (message.type === "ANALYZE_PRODUCT") {
    const { payload: product } = message as AnalyzeProductMessage
    console.log("[EcoOffset] ANALYZE_PRODUCT received for:", product.name)

    ;(async () => {
      try {
        const result = await llmService.analyze(product)
        console.log("[EcoOffset] LLM analysis complete for:", product.name)
        sendResponse({ type: "ANALYSIS_RESULT", payload: result })
      } catch (llmErr) {
        const isOriginError = llmErr instanceof Error && llmErr.message.includes("403")
        if (isOriginError) {
          console.warn(
            "[EcoOffset] Ollama origin not allowed (HTTP 403).\n" +
              "Fix: set OLLAMA_ORIGINS before starting Ollama.\n" +
              '  macOS/Linux (CLI):  OLLAMA_ORIGINS="*" ollama serve\n' +
              '  macOS (Ollama app): launchctl setenv OLLAMA_ORIGINS "*" && pkill Ollama\n' +
              "  Linux (systemd):    add Environment=OLLAMA_ORIGINS=* to the service unit\n" +
              "Falling back to mock analysis.",
          )
        } else {
          console.warn("[EcoOffset] LLM analysis failed, falling back to mock:", llmErr)
        }
        try {
          const result = await mockService.analyze(product)
          sendResponse({ type: "ANALYSIS_RESULT", payload: result })
        } catch (mockErr) {
          console.error("[EcoOffset] Mock fallback also failed:", mockErr)
          sendResponse({ type: "ERROR", payload: { message: "Analysis failed." } })
        }
      }
    })()

    // Return true to keep the message channel open for the async sendResponse call.
    return true
  }

  // All other message types are ignored — returning false closes the channel synchronously.
  return false
})
