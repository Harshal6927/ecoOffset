import type { Platform } from "./platform"

export class AliExpressPlatform implements Platform {
  readonly id = "aliexpress"
  readonly displayName = "AliExpress"

  matchesUrl(url: string): boolean {
    return /aliexpress\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="root"]/div/div[1]/div/div[1]/div[1]/div[2]/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="root"]/div/div[1]/div/div[1]/div[1]/div[2]/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
