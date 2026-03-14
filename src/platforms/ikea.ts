import type { Platform } from "./platform"

export class IkeaPlatform implements Platform {
  readonly id = "ikea"
  readonly displayName = "IKEA"

  matchesUrl(url: string): boolean {
    return /ikea\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="content"]/div/div[2]/div[2]/div[2]/div[1]/div[1]/div/div[1]/h1/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="content"]/div/div[2]/div[2]/div[2]/div[1]/div[1]/div/div[1]/h1/span[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
