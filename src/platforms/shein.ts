import type { Platform } from "./platform"

export class SheinPlatform implements Platform {
  readonly id = "shein"
  readonly displayName = "Shein"

  matchesUrl(url: string): boolean {
    return /shein\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate(
      '//*[@id="goods-detail-mian"]/div[2]/div[1]/section[2]/section[1]/header/h1/span[1]',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="goods-detail-mian"]/div[2]/div[1]/section[2]/section[1]/header/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
