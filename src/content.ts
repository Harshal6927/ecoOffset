/**
 * Content script — entry point injected into every product page on
 * supported shopping platforms (Amazon, eBay).
 *
 * Responsibilities:
 *  1. Detect the active platform.
 *  2. Wait for the product title element to appear in the DOM.
 *  3. Run the eco analysis.
 *  4. Inject the eco-badge below the product title.
 *  5. Show/hide the detail panel on badge click.
 *
 * To swap in a real LLM-backed analysis service:
 *  - Create a class implementing AnalysisService in src/analysis/
 *  - Replace `new MockAnalysisService()` below with your implementation.
 */
import { MockAnalysisService } from "./analysis/mock"
import { detectPlatform } from "./platforms"
import type { AnalysisResult } from "./types"
import { DetailPanel } from "./ui/detail-panel"
import { EcoBadge } from "./ui/eco-badge"

// ---------------------------------------------------------------------------
// Analysis service — swap this out for an LLM-backed service when ready
// ---------------------------------------------------------------------------
const analysisService = new MockAnalysisService()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
/** The currently open detail panel, or null when the panel is closed. */
let currentPanel: DetailPanel | null = null
/** True once the badge has been injected for the current page URL. Reset on SPA navigation. */
let injected = false

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Waits for the platform's injection point element to appear in the DOM, then
 * calls `callback` with the element. Uses a MutationObserver (not a busy-wait
 * loop) so it adds no CPU overhead while waiting.
 *
 * Silently times out if the element does not appear within `timeout` ms — the
 * badge simply won't be injected for that page load. This handles pages where
 * the product title never renders (e.g. navigation to a non-product URL).
 *
 * @param getElement - Returns the injection point element if present, else null.
 * @param timeout    - Maximum wait time in milliseconds.
 * @param callback   - Invoked once with the found element.
 */
function waitForInjectionPoint(getElement: () => Element | null, timeout: number, callback: (el: Element) => void): void {
  const el = getElement()
  if (el) {
    callback(el)
    return
  }

  const deadline = Date.now() + timeout
  const observer = new MutationObserver(() => {
    const found = getElement()
    if (found) {
      observer.disconnect()
      callback(found)
      return
    }
    if (Date.now() > deadline) {
      observer.disconnect()
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Opens the detail panel for the given analysis result, replacing any panel
 * that is already open.
 */
function showPanel(result: AnalysisResult): void {
  if (currentPanel) {
    currentPanel.destroy()
    currentPanel = null
  }
  currentPanel = new DetailPanel(result, () => {
    currentPanel?.destroy()
    currentPanel = null
  })
  document.body.appendChild(currentPanel.element)
}

/**
 * Inserts the eco badge immediately after `injectionPoint`.
 * The `injected` guard prevents duplicate badges if this is called more than
 * once for the same page load (e.g. by concurrent MutationObserver callbacks).
 */
function injectBadge(injectionPoint: Element, result: AnalysisResult): void {
  if (injected) return
  injected = true

  const badge = new EcoBadge(result, () => showPanel(result))
  injectionPoint.insertAdjacentElement("afterend", badge.element)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point for a single page load (or SPA navigation).
 *
 * Detects the platform, resolves the product name and injection point
 * (waiting up to 10 s if the DOM isn't ready yet), runs the eco analysis,
 * and injects the badge.
 */
async function main(): Promise<void> {
  const platform = detectPlatform()
  if (!platform) return // Not a supported shopping site

  const productName = platform.getProductName()
  if (!productName) {
    // Product name not yet in DOM — wait for the injection point to appear
    // then re-run to pick up the name
    waitForInjectionPoint(
      () => platform.getInjectionPoint(),
      10_000,
      async (injectionPoint) => {
        const name = platform.getProductName()
        if (!name) return

        const product = { name, platform: platform.id, url: window.location.href }
        const result = await analysisService.analyze(product)
        injectBadge(injectionPoint, result)
      },
    )
    return
  }

  const injectionPoint = platform.getInjectionPoint()
  if (!injectionPoint) return

  const product = { name: productName, platform: platform.id, url: window.location.href }
  const result = await analysisService.analyze(product)
  injectBadge(injectionPoint, result)
}

// Run on initial page load
main()

// Re-run on SPA navigations (Amazon/eBay use client-side routing for some
// flows). We watch for any DOM mutation and compare window.location.href;
// this is simpler and more reliable than patching history.pushState/popstate,
// which can be overridden by framework routers.
let lastUrl = window.location.href
const navObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    injected = false
    currentPanel?.destroy()
    currentPanel = null
    main()
  }
})
navObserver.observe(document.body, { childList: true, subtree: true })
