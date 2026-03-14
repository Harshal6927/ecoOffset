import type { Platform } from "./platform"

export class HomeDepotPlatform implements Platform {
  readonly id = "homedepot"
  readonly displayName = "Home Depot"

  matchesUrl(url: string): boolean {
    return /homedepot\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate(
      "/html/body/app-container/div[1]/landing/landing-product/div[2]/main/div[1]/div[5]/div[1]/div[1]/h1/span[2]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate(
      "/html/body/app-container/div[1]/landing/landing-product/div[2]/main/div[1]/div[5]/div[1]/div[1]/h1/span[2]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    return (result.singleNodeValue as Element | null) ?? null
  }
}
