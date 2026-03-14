/**
 * Eco Badge — compact widget injected below the product title.
 *
 * Rendered inside a Shadow DOM root so Amazon/eBay page styles cannot
 * interfere with our UI and our styles cannot break their pages.
 *
 * Displays:
 *  - An overall eco-score pill (green / amber / red)
 *  - A "View eco-friendly alternatives" call-to-action link
 *
 * Clicking the badge fires the provided onClick callback.
 */
import type { AnalysisResult } from "../types"

/**
 * Maps an average eco score to a severity level.
 *
 * Thresholds (0–100, lower = better):
 *   ≤ 40  → "low"    (green)
 *   ≤ 65  → "medium" (amber)
 *   > 65  → "high"   (red)
 *
 * These same thresholds are used in detail-panel.ts (`scoreColor`).
 * If you change them here, update that function too.
 */
function scoreToLevel(score: number): "low" | "medium" | "high" {
  if (score <= 40) return "low"
  if (score <= 65) return "medium"
  return "high"
}

/**
 * Computes a single overall eco score by averaging carbon, water, and waste
 * scores with equal weighting (each contributes 1/3).
 */
function averageScore(result: AnalysisResult): number {
  const { carbonScore, waterScore, wasteScore } = result.ecoImpact
  return Math.round((carbonScore + waterScore + wasteScore) / 3)
}

const LEVEL_STYLES: Record<"low" | "medium" | "high", { bg: string; text: string; label: string }> = {
  low: { bg: "#d1fae5", text: "#065f46", label: "Low impact" },
  medium: { bg: "#fef3c7", text: "#92400e", label: "Medium impact" },
  high: { bg: "#fee2e2", text: "#991b1b", label: "High impact" },
}

const BASE_STYLES = `
  :host {
    all: initial;
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.4;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
    padding: 5px 10px;
    border-radius: 20px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .badge:hover {
    background: #f3f4f6;
    box-shadow: 0 1px 4px rgba(0,0,0,0.10);
  }
  .score-pill {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .label {
    color: #374151;
    font-size: 12px;
  }
  .leaf {
    font-size: 14px;
  }
  .caret {
    color: #9ca3af;
    font-size: 10px;
    margin-left: 2px;
  }
`

export class EcoBadge {
  private readonly host: HTMLElement
  private readonly shadowRoot: ShadowRoot

  /**
   * @param result  - Analysis result used to compute the displayed score level.
   * @param onClick - Callback invoked when the badge is activated (click or Enter/Space).
   */
  constructor(result: AnalysisResult, onClick: () => void) {
    this.host = document.createElement("div")
    // Marker attribute so the content script can detect an already-injected badge
    // and avoid duplicate injection (guards against SPA re-navigation).
    this.host.setAttribute("data-ecooffset", "badge")

    this.shadowRoot = this.host.attachShadow({ mode: "open" })

    const avg = averageScore(result)
    const level = scoreToLevel(avg)
    const { bg, text, label } = LEVEL_STYLES[level]

    const style = document.createElement("style")
    style.textContent = BASE_STYLES

    const badge = document.createElement("div")
    badge.className = "badge"
    badge.setAttribute("role", "button")
    badge.setAttribute("tabindex", "0")
    badge.setAttribute("aria-label", `EcoOffset: ${label} environmental impact. Click for eco-friendly alternatives.`)
    badge.innerHTML = `
      <span class="leaf" aria-hidden="true">&#127807;</span>
      <span class="score-pill" style="background:${bg};color:${text};">${label}</span>
      <span class="label">View eco-friendly alternatives</span>
      <span class="caret" aria-hidden="true">&#9654;</span>
    `

    badge.addEventListener("click", onClick)
    // Keyboard accessibility: treat Enter and Space as activation (matching
    // native button behaviour) since this is a div with role="button".
    badge.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onClick()
      }
    })

    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(badge)
  }

  /** The host element — insert this into the DOM. */
  get element(): HTMLElement {
    return this.host
  }
}
