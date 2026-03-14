import type { Platform } from "./platform"

export class BhPhotoPlatform implements Platform {
  readonly id = "bhphoto"
  readonly displayName = "B&H Photo"

  matchesUrl(url: string): boolean {
    return /bhphotovideo\.[a-z.]+/i.test(url)
  }

  getProductName(): string | null {
    const result = document.evaluate('//*[@id="bh-app"]/section/div/div/div[2]/div[4]/div[1]/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const node = result.singleNodeValue as HTMLElement | null
    return node?.textContent?.trim() ?? null
  }

  getInjectionPoint(): Element | null {
    const result = document.evaluate('//*[@id="bh-app"]/section/div/div/div[2]/div[4]/div[1]/div[1]/h1', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return (result.singleNodeValue as Element | null) ?? null
  }
}
