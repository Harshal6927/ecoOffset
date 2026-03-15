/**
 * Eco Badge — compact widget injected below the product title.
 *
 * Rendered inside a Shadow DOM root so Amazon/eBay page styles cannot
 * interfere with our UI and our styles cannot break their pages.
 *
 * Displays:
 *  - An overall eco-score pill (green / amber / red) derived from carbon grade,
 *    water score, and recyclable percent
 *  - A "View eco-friendly alternatives" call-to-action link
 *
 * Clicking the badge fires the provided onClick callback.
 */
import type { AnalysisResult } from "../types"
import { carbonGradeToScore, getCarbonGrade } from "../types"

/**
 * Maps an average eco score to a severity level.
 *
 * Thresholds (0鈥?00, lower = better):
 *   鈮?40  鈫?"low"    (green)
 *   鈮?65  鈫?"medium" (amber)
 *   > 65  鈫?"high"   (red)
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
 * Computes a single overall eco score by averaging a normalised carbon score
 * (derived from the carbon grade), water score, and inverted recyclable percent
 * with equal weighting.
 *
 * carbonKgCo2eq is first converted to a letter grade (A/B/C/D), then mapped to
 * a normalised 0–100 value (A=20, B=40, C=60, D=80) so it is comparable with
 * the 0–100 water score. recyclablePercent is inverted (100 - value) so that
 * higher recyclability contributes a lower (better) score.
 */
function averageScore(result: AnalysisResult): number {
  const { carbonKgCo2eq, waterScore, recyclablePercent } = result.ecoImpact
  const normalizedCarbon = carbonGradeToScore(getCarbonGrade(carbonKgCo2eq))
  return Math.round((normalizedCarbon + waterScore + (100 - recyclablePercent)) / 3)
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
    font-family: "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    line-height: 1.4;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(209, 213, 219, 0.9);
    background: linear-gradient(145deg, #ffffff, #f3f8f5);
    cursor: pointer;
    user-select: none;
    box-shadow:
      0 10px 24px rgba(15, 23, 42, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.85);
    transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }
  .badge:hover {
    background: linear-gradient(145deg, #ffffff, #eefbf4);
    box-shadow:
      0 14px 28px rgba(15, 23, 42, 0.12),
      inset 0 1px 0 rgba(255,255,255,0.92);
    transform: translateY(-1px);
  }
  .score-pill {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
  }
  .label {
    color: #334155;
    font-size: 12px;
    font-weight: 600;
  }
  .leaf {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: linear-gradient(145deg, #ecfdf5, #dcfce7);
    color: #047857;
    font-size: 13px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }
  .caret {
    color: #94a3b8;
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

  /** The host element 鈥?insert this into the DOM. */
  get element(): HTMLElement {
    return this.host
  }
}
