/**
 * Detail Panel — expanded eco-impact view shown when the user clicks the badge.
 *
 * Also rendered inside a Shadow DOM root for style isolation.
 *
 * Displays:
 *  - Carbon / water / waste scores with visual progress bars
 *  - A plain-English impact summary
 *  - Eco-friendly alternative suggestions with direct search links
 *  - Actionable tips to reduce the product's environmental impact
 *
 * The panel is appended to <body> as a fixed overlay so it doesn't break
 * the host page's layout.
 */
import type { AnalysisResult } from "../types"

const PANEL_STYLES = `
  :host {
    all: initial;
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #111827;
  }

  .overlay {
    position: fixed;
    top: 0; right: 0; bottom: 0; left: 0;
    background: rgba(0,0,0,0.35);
    /* 2147483646 = INT_MAX - 1, the highest z-index reliably supported across
       browsers. Keeps the overlay on top of any host-page stacking contexts. */
    z-index: 2147483646;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 16px;
  }

  .panel {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.20);
    width: 340px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.18s ease-out;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    background: #ffffff;
    border-radius: 12px 12px 0 0;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    font-size: 15px;
    color: #065f46;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: #6b7280;
    padding: 0 2px;
    line-height: 1;
    border-radius: 4px;
  }
  .close-btn:hover { color: #111827; background: #f3f4f6; }

  .body { padding: 12px 16px 16px; }

  .product-name {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .section-title {
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 14px 0 6px;
  }

  .summary {
    font-size: 13px;
    color: #374151;
    margin-bottom: 4px;
  }

  /* Score bars */
  .score-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 0;
  }
  .score-label {
    width: 56px;
    font-size: 12px;
    color: #374151;
    flex-shrink: 0;
  }
  .bar-track {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease;
  }
  .score-value {
    width: 26px;
    font-size: 11px;
    color: #6b7280;
    text-align: right;
    flex-shrink: 0;
  }

  /* Alternatives */
  .alt-card {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 8px 10px;
    margin: 6px 0;
  }
  .alt-name {
    font-weight: 600;
    font-size: 13px;
    color: #065f46;
    margin-bottom: 3px;
  }
  .alt-reason {
    font-size: 12px;
    color: #374151;
    margin-bottom: 6px;
  }
  .alt-link {
    display: inline-block;
    font-size: 12px;
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }
  .alt-link:hover { text-decoration: underline; }

  /* Tips */
  .tips-list {
    margin: 4px 0 0;
    padding-left: 16px;
  }
  .tips-list li {
    font-size: 12px;
    color: #374151;
    margin: 4px 0;
  }

  /* Footer */
  .footer {
    padding: 8px 16px 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }
`

/**
 * Returns a fill colour for an individual eco score bar (0–100, lower = better).
 *
 * Uses the same thresholds as `scoreToLevel` in eco-badge.ts:
 *   ≤ 40 → green (#10b981)
 *   ≤ 65 → amber (#f59e0b)
 *   > 65 → red   (#ef4444)
 *
 * If you change these thresholds, update eco-badge.ts `scoreToLevel` too.
 */
function scoreColor(score: number): string {
  if (score <= 40) return "#10b981" // green
  if (score <= 65) return "#f59e0b" // amber
  return "#ef4444" // red
}

export class DetailPanel {
  private readonly host: HTMLElement
  private readonly shadowRoot: ShadowRoot

  /**
   * @param result  - Analysis result to display in the panel.
   * @param onClose - Callback invoked whenever the panel should be dismissed
   *                  (close button, overlay click, or Escape key).
   */
  constructor(result: AnalysisResult, onClose: () => void) {
    this.host = document.createElement("div")
    // Marker attribute so the content script can detect an existing panel.
    this.host.setAttribute("data-ecooffset", "panel")

    this.shadowRoot = this.host.attachShadow({ mode: "open" })

    const { ecoImpact, alternatives, tips, product } = result
    const { carbonScore, waterScore, wasteScore, summary } = ecoImpact

    const style = document.createElement("style")
    style.textContent = PANEL_STYLES

    // Build score bars HTML
    const scores = [
      { label: "Carbon", value: carbonScore },
      { label: "Water", value: waterScore },
      { label: "Waste", value: wasteScore },
    ]
    const scoreBarsHtml = scores
      .map(
        ({ label, value }) => `
        <div class="score-row">
          <span class="score-label">${label}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${value}%;background:${scoreColor(value)};"></div>
          </div>
          <span class="score-value">${value}/100</span>
        </div>
      `,
      )
      .join("")

    // Build alternatives HTML
    const alternativesHtml = alternatives
      .map(
        (alt) => `
        <div class="alt-card">
          <div class="alt-name">${escapeHtml(alt.name)}</div>
          <div class="alt-reason">${escapeHtml(alt.reason)}</div>
          <a class="alt-link" href="${alt.searchUrl}" target="_blank" rel="noopener noreferrer">
            Search for this alternative &#8599;
          </a>
        </div>
      `,
      )
      .join("")

    // Build tips HTML
    const tipsHtml = tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")

    const overlay = document.createElement("div")
    overlay.className = "overlay"
    overlay.innerHTML = `
      <div class="panel" role="dialog" aria-label="EcoOffset product analysis" aria-modal="true">
        <div class="header">
          <div class="header-title">
            <span aria-hidden="true">&#127807;</span>
            EcoOffset
          </div>
          <button class="close-btn" aria-label="Close eco panel">&#10005;</button>
        </div>
        <div class="body">
          <div class="product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</div>

          <div class="section-title">Environmental Impact</div>
          <div class="summary">${escapeHtml(summary)}</div>
          ${scoreBarsHtml}

          <div class="section-title">Eco-Friendly Alternatives</div>
          ${alternativesHtml}

          <div class="section-title">Tips to Reduce Impact</div>
          <ul class="tips-list">${tipsHtml}</ul>
        </div>
        <div class="footer">Powered by EcoOffset &bull; Data is illustrative</div>
      </div>
    `

    // Close on overlay background click.
    // e.target === overlay (not .panel) ensures clicks inside the panel itself
    // don't dismiss it — only clicks on the dimmed backdrop do.
    overlay.addEventListener("click", (e: MouseEvent) => {
      if (e.target === overlay) onClose()
    })

    // Close button
    const closeBtn = overlay.querySelector(".close-btn")
    closeBtn?.addEventListener("click", onClose)

    // Close on Escape key
    document.addEventListener("keydown", this.handleKeyDown.bind(this, onClose))

    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(overlay)
  }

  private handleKeyDown(onClose: () => void, e: KeyboardEvent): void {
    if (e.key === "Escape") onClose()
  }

  /** The host element — append this to <body> to show the panel. */
  get element(): HTMLElement {
    return this.host
  }

  /**
   * Removes the panel from the DOM and cleans up the document-level keydown
   * listener to prevent a memory leak.
   */
  destroy(): void {
    document.removeEventListener("keydown", this.handleKeyDown as EventListener)
    this.host.remove()
  }
}

/**
 * Escapes HTML special characters to prevent XSS when inserting untrusted
 * strings (product names, alternative titles, tips) into innerHTML.
 */
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}
