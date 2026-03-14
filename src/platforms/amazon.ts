import type { Platform } from "./platform"

/**
 * Amazon platform adapter.
 *
 * Matches all regional Amazon domains (amazon.com, amazon.ca, amazon.co.uk, etc.).
 * Product name XPath: //*[@id="productTitle"]
 */
export class AmazonPlatform implements Platform {
  readonly id = "amazon"
  readonly displayName = "Amazon"

  matchesUrl(url: string): boolean {
    // The `.` inside the character class matches any character, covering
    // multi-part TLDs such as amazon.co.uk or amazon.com.au.
    return /amazon\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="productTitle"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    // Returns the same #productTitle element used by getProductName.
    // The eco-badge is inserted immediately after it via insertAdjacentElement("afterend").
    const result = document.evaluate('//*[@id="productTitle"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
