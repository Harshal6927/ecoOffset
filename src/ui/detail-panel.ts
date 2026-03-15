/**
 * Detail Panel 鈥?expanded eco-impact view shown when the user clicks the badge.
 *
 * Also rendered inside a Shadow DOM root for style isolation.
 *
 * Displays:
 *  - Carbon kgCO2eq + grade badge (A/B/C/D)
 *  - Water / waste scores with visual progress bars
 *  - A plain-English impact summary
 *  - Eco-friendly alternative suggestions with direct search links
 *  - Actionable tips to reduce the product's environmental impact
 *
 * The panel is appended to <body> as a fixed overlay so it doesn't break
 * the host page's layout.
 */
import type { AnalysisResult } from "../types"
import { getCarbonGrade } from "../types"

const PANEL_STYLES = `
  :host {
    all: initial;
    display: block;
    font-family: "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    color: #10231d;
  }

  .overlay {
    position: fixed;
    top: 0; right: 0; bottom: 0; left: 0;
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.28)),
      rgba(6, 78, 59, 0.12);
    backdrop-filter: blur(8px);
    /* 2147483646 = INT_MAX - 1, the highest z-index reliably supported across
       browsers. Keeps the overlay on top of any host-page stacking contexts. */
    z-index: 2147483646;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 20px;
  }

  .panel {
    background:
      linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,250,248,0.98));
    border: 1px solid rgba(209, 250, 229, 0.9);
    border-radius: 24px;
    box-shadow:
      0 28px 70px rgba(15, 23, 42, 0.22),
      0 8px 24px rgba(16, 185, 129, 0.08);
    width: min(380px, calc(100vw - 40px));
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.22s ease-out;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(28px) scale(0.985); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(209, 213, 219, 0.78);
    position: sticky;
    top: 0;
    background:
      linear-gradient(145deg, rgba(246,255,249,0.97), rgba(236,253,245,0.95));
    backdrop-filter: blur(18px);
    border-radius: 24px 24px 0 0;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.01em;
    color: #065f46;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.78);
    border: 1px solid rgba(209, 213, 219, 0.9);
    cursor: pointer;
    font-size: 16px;
    color: #6b7280;
    line-height: 1;
    border-radius: 999px;
    transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
  }
  .close-btn:hover {
    color: #10231d;
    background: #ffffff;
    transform: translateY(-1px);
  }

  .body { padding: 16px 20px 20px; }

  .product-name {
    font-size: 12px;
    color: #5f6f68;
    margin-bottom: 14px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.88);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .section-title {
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #7a8b84;
    margin: 18px 0 8px;
  }

  .summary {
    font-size: 13px;
    color: #334155;
    margin-bottom: 8px;
    padding: 12px 14px;
    border-radius: 16px;
    background: linear-gradient(145deg, #fbfffc, #f2faf6);
    border: 1px solid rgba(220, 252, 231, 0.95);
  }

  /* Score bars */
  .score-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(255,255,255,0.78);
    border: 1px solid rgba(226, 232, 240, 0.82);
  }
  .score-label {
    width: 60px;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    flex-shrink: 0;
  }
  .bar-track {
    flex: 1;
    height: 9px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .score-value {
    width: 46px;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-align: right;
    flex-shrink: 0;
  }

  /* Carbon-specific row: kgCO2e value + grade pill */
  .carbon-kg {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .carbon-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .grade-a { background: #d1fae5; color: #065f46; }
  .grade-b { background: #d9f99d; color: #365314; }
  .grade-c { background: #fef3c7; color: #92400e; }
  .grade-d { background: #fee2e2; color: #991b1b; }

  /* Alternatives */
  .alt-card {
    background: linear-gradient(145deg, #f8fffb, #effcf4);
    border: 1px solid rgba(187, 247, 208, 0.95);
    border-radius: 18px;
    padding: 12px 14px;
    margin: 8px 0;
    box-shadow: 0 10px 24px rgba(16, 185, 129, 0.08);
  }
  .alt-name {
    font-weight: 700;
    font-size: 13px;
    color: #065f46;
    margin-bottom: 4px;
  }
  .alt-reason {
    font-size: 12px;
    color: #334155;
    margin-bottom: 8px;
  }
  .alt-link {
    display: inline-block;
    font-size: 12px;
    color: #0f766e;
    text-decoration: none;
    font-weight: 700;
  }
  .alt-link:hover { text-decoration: underline; }

  /* Tips */
  .tips-list {
    margin: 6px 0 0;
    padding: 12px 14px 12px 30px;
    border-radius: 18px;
    background: rgba(255,255,255,0.82);
    border: 1px solid rgba(226, 232, 240, 0.84);
  }
  .tips-list li {
    font-size: 12px;
    color: #334155;
    margin: 6px 0;
  }

  /* Footer */
  .footer {
    padding: 10px 20px 16px;
    border-top: 1px solid rgba(229, 231, 235, 0.9);
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    background: rgba(255,255,255,0.65);
  }

  @media (max-width: 640px) {
    .overlay {
      padding: 12px;
      justify-content: center;
    }

    .panel {
      width: 100%;
      max-height: calc(100vh - 24px);
    }
  }
`

/**
 * Returns a fill colour for an individual eco score bar (0鈥?00, lower = better).
 *
 * Uses the same thresholds as `scoreToLevel` in eco-badge.ts:
 *   鈮?40 鈫?green (#10b981)
 *   鈮?65 鈫?amber (#f59e0b)
 *   > 65 鈫?red   (#ef4444)
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
    const { carbonKgCo2eq, waterScore, wasteScore, summary } = ecoImpact

    const style = document.createElement("style")
    style.textContent = PANEL_STYLES

    // Carbon row: kgCO2eq value + letter grade badge (no progress bar)
    const carbonGrade = getCarbonGrade(carbonKgCo2eq)
    const carbonRowHtml = `
      <div class="score-row">
        <span class="score-label">Carbon</span>
        <span class="carbon-kg">${carbonKgCo2eq.toFixed(1)} kg CO&#x2082;e</span>
        <span class="carbon-grade grade-${carbonGrade.toLowerCase()}">${carbonGrade}</span>
      </div>
    `

    // Water and waste rows: 0–100 progress bars (unchanged)
    const waterWasteBarsHtml = [
      { label: "Water", value: waterScore },
      { label: "Waste", value: wasteScore },
    ]
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

    const scoreBarsHtml = carbonRowHtml + waterWasteBarsHtml

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
    // don't dismiss it 鈥?only clicks on the dimmed backdrop do.
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

  /** The host element 鈥?append this to <body> to show the panel. */
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
