import type { Platform } from "./platform"

export class CostcoPlatform implements Platform {
  readonly id = "costco"
  readonly displayName = "Costco"

  matchesUrl(url: string): boolean {
    return /costco\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="product-details"]/div[1]/div/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="product-details"]/div[1]/div/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
