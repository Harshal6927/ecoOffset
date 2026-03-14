import type { Platform } from "./platform"

export class NeweggPlatform implements Platform {
  readonly id = "newegg"
  readonly displayName = "Newegg"

  matchesUrl(url: string): boolean {
    return /newegg\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="newProductPageContent"]/div/div/div/div[2]/div[1]/div[4]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="newProductPageContent"]/div/div/div/div[2]/div[1]/div[4]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
