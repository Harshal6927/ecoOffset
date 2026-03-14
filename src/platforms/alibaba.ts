import type { Platform } from "./platform"

export class AlibabaPlatform implements Platform {
  readonly id = "alibaba"
  readonly displayName = "Alibaba"

  matchesUrl(url: string): boolean {
    return /alibaba\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="container"]/main/div[1]/div[1]/div[2]/div/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="container"]/main/div[1]/div[1]/div[2]/div/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
