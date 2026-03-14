import type { Platform } from "./platform"

/**
 * eBay platform adapter.
 *
 * Matches all regional eBay domains (ebay.com, ebay.ca, ebay.co.uk, etc.).
 * Product name XPath: //*[@id="mainContent"]/div/div[1]/h1/span
 *
 * Note: the XPath relies on eBay's current DOM structure and may need updating
 * if eBay changes their product page layout.
 */
export class EbayPlatform implements Platform {
  readonly id = "ebay"
  readonly displayName = "eBay"

  matchesUrl(url: string): boolean {
    // The `.` inside the character class covers multi-part TLDs (e.g. ebay.co.uk).
    return /ebay\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    // Targets the <span> inside the <h1> that holds the product title text.
    const result = document.evaluate('//*[@id="mainContent"]/div/div[1]/h1/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    // Targets the <h1> (one level up from the title span) so the eco-badge is
    // inserted after the entire heading block, not inside it.
    const result = document.evaluate('//*[@id="mainContent"]/div/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
