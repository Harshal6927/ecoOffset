/**
 * Platform interface — every supported shopping site implements this.
 *
 * Adding a new platform:
 *  1. Create a new file in src/platforms/ implementing this interface.
 *  2. Register it in src/platforms/index.ts.
 *  No other files need to change.
 */
export interface Platform {
  /** Unique identifier for this platform (e.g. "amazon"). */
  readonly id: string

  /** Human-readable display name (e.g. "Amazon"). */
  readonly displayName: string

  /**
   * Returns true if this platform handles the given URL.
   * Called once on page load to detect the active platform.
   */
  matchesUrl(url: string): boolean

  /**
   * Extracts the product name from the current DOM.
   * Returns null if no product is found on this page.
   */
  getProductName(): string | null

  /**
   * Returns the DOM element after which the eco-badge should be inserted.
   * Returns null if the injection point cannot be found.
   */
  getInjectionPoint(): Element | null
}
