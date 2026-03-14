/**
 * Background service worker.
 *
 * Currently acts as a message relay and lifecycle manager.
 * Structured to support future LLM API integration — move `analyze()` calls
 * here to keep API keys out of content scripts and to share a response cache
 * across all tabs.
 *
 * Message protocol is defined in src/types/index.ts.
 */
import type { AnalyzeProductMessage, ExtensionMessage } from "./types"

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
// Message handling
// ---------------------------------------------------------------------------

/**
 * Handle messages from content scripts.
 *
 * Currently a pass-through scaffold. When LLM integration is added:
 *  - Listen for ANALYZE_PRODUCT messages
 *  - Call the LLM API (API key stored securely in the background)
 *  - Reply with ANALYSIS_RESULT
 *
 * Content scripts can then send requests via:
 *   chrome.runtime.sendMessage({ type: "ANALYZE_PRODUCT", payload: product })
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response: ExtensionMessage) => void) => {
  if (message.type === "ANALYZE_PRODUCT") {
    const { payload } = message as AnalyzeProductMessage
    console.log("[EcoOffset] Received ANALYZE_PRODUCT request for:", payload.name)

    // TODO: Replace with LLM API call when ready.
    // For now, analysis is handled directly in the content script.
    // When moving to background-worker analysis:
    //   1. Call your LLM service here
    //   2. sendResponse({ type: "ANALYSIS_RESULT", payload: result })
    //   3. return true (to keep the message channel open for async response)

    sendResponse({ type: "ERROR", payload: { message: "Background analysis not yet implemented — using local mock." } })
  }

  // All other message types are ignored intentionally — the listener returns
  // false (synchronous / no response) so Chrome can close the message channel.
  // return true is only needed when sendResponse will be called asynchronously.
  return false
})

// ---------------------------------------------------------------------------
// Keep the service worker alive during active analysis (Chrome MV3 workaround)
// ---------------------------------------------------------------------------

// Service workers in MV3 are short-lived. If future LLM calls take > ~30s,
// uncomment the alarm below to keep the worker alive.
// This is intentionally left as commented-out scaffolding — not dead code.
// chrome.alarms.create("keepAlive", { periodInMinutes: 0.4 })
// chrome.alarms.onAlarm.addListener(() => { /* no-op to keep alive */ })
