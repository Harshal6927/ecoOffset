import type { Platform } from "./platform"

export class EtsyPlatform implements Platform {
  readonly id = "etsy"
  readonly displayName = "Etsy"

  matchesUrl(url: string): boolean {
    return /etsy\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="listing-page-cart"]/div[5]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="listing-page-cart"]/div[5]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
