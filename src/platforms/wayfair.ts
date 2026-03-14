import type { Platform } from "./platform"

export class WayfairPlatform implements Platform {
  readonly id = "wayfair"
  readonly displayName = "Wayfair"

  matchesUrl(url: string): boolean {
    return /wayfair\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate(
      "/html/body/div[2]/div[2]/div[1]/div[2]/div/div[2]/div[1]/div/div/div/div[1]/div/h1",
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
      "/html/body/div[2]/div[2]/div[1]/div[2]/div/div[2]/div[1]/div/div/div/div[1]/div/h1",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    return (result.singleNodeValue as Element | null) ?? null
  }
}
