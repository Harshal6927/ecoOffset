import type { Platform } from "./platform"

export class TargetPlatform implements Platform {
  readonly id = "target"
  readonly displayName = "Target"

  matchesUrl(url: string): boolean {
    return /target\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="pdp-product-title-id"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="pdp-product-title-id"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
