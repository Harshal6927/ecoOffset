import type { Platform } from "./platform"

export class MicrocenterPlatform implements Platform {
  readonly id = "microcenter"
  readonly displayName = "Micro Center"

  matchesUrl(url: string): boolean {
    return /microcenter\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="product-details-control"]/div[2]/h1/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="product-details-control"]/div[2]/h1/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
