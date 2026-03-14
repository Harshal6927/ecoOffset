import type { Platform } from "./platform"

export class ApplePlatform implements Platform {
  readonly id = "apple"
  readonly displayName = "Apple Store"

  matchesUrl(url: string): boolean {
    return /apple\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="root"]/div[3]/div[1]/div[1]/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="root"]/div[3]/div[1]/div[1]/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
