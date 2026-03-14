import type { Platform } from "./platform"

export class BestBuyPlatform implements Platform {
  readonly id = "bestbuy"
  readonly displayName = "Best Buy"

  matchesUrl(url: string): boolean {
    return /bestbuy\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="root"]/div/div[3]/main/section[2]/div/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="root"]/div/div[3]/main/section[2]/div/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
