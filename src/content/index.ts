import { requestAlternativeRecommendations } from "../shared/recommendationApi"
import { recordEvent } from "../engine/metrics"
import type { RecommendationContext, UserPreferences } from "../engine/types"
type ProductContext = {
  source: "product" | "cart"
  asin?: string
  title: string
  price?: number
  currency?: string
  quantity?: number
  imageUrl?: string
  brand?: string
  categoryPath?: string[]
  raw: Record<string, unknown>
}

type CartContext = {
  items: ProductContext[]
}

type Preferences = {
  suggestAlternatives: boolean
  footprintSensitivity: "balanced" | "max_reduction" | "price_friendly"
}

const defaultPreferences: Preferences = {
  suggestAlternatives: true,
  footprintSensitivity: "balanced",
}

function loadPreferences(): Promise<Preferences> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) {
      resolve(defaultPreferences)
      return
    }

    chrome.storage.sync.get(defaultPreferences, (result) => {
      const prefs: Preferences = {
        suggestAlternatives:
          typeof result.suggestAlternatives === "boolean"
            ? result.suggestAlternatives
            : defaultPreferences.suggestAlternatives,
        footprintSensitivity:
          result.footprintSensitivity ?? defaultPreferences.footprintSensitivity,
      }
      resolve(prefs)
    })
  })
}

function getText(el: Element | null): string | undefined {
  if (!el) return undefined
  const text = el.textContent?.trim()
  return text || undefined
}

function parsePrice(text?: string): { value?: number; currency?: string } {
  if (!text) return {}
  // Examples: "$19.99", "₹1,299.00"
  const match = text.match(/([\p{Sc}])\s*([\d.,]+)/u)
  if (!match) return {}
  const currency = match[1]
  const numeric = Number(match[2].replace(/,/g, ""))
  if (Number.isNaN(numeric)) return { currency }
  return { value: numeric, currency }
}

function isProductDetailPage(url: Location): boolean {
  const path = url.pathname
  return /\/dp\/|\/gp\/product\//.test(path)
}

function isCartOrCheckoutPage(url: Location): boolean {
  const path = url.pathname
  return (
    path.startsWith("/gp/cart") ||
    path.startsWith("/cart") ||
    path.includes("/gp/buy/") ||
    path.includes("/checkout")
  )
}

function getASINFromUrl(url: Location): string | undefined {
  const dpMatch = url.pathname.match(/\/dp\/([A-Z0-9]{8,16})/)
  if (dpMatch) return dpMatch[1]
  const gpMatch = url.pathname.match(/\/gp\/product\/([A-Z0-9]{8,16})/)
  if (gpMatch) return gpMatch[1]
  const params = new URLSearchParams(url.search)
  const asinParam = params.get("asin")
  return asinParam || undefined
}

function getProductContextFromPDP(): ProductContext | undefined {
  const titleEl =
    document.getElementById("productTitle") ??
    document.querySelector("#title span[id^='productTitle']")
  const title = getText(titleEl)
  if (!title) return undefined

  const priceEl =
    document.getElementById("priceblock_ourprice") ??
    document.getElementById("priceblock_dealprice") ??
    document.querySelector("#corePrice_desktop span.a-offscreen")
  const priceText = getText(priceEl)
  const { value: price, currency } = parsePrice(priceText)

  const brandEl =
    document.getElementById("bylineInfo") ??
    document.querySelector("#bylineInfo")
  const brand = getText(brandEl)

  const imageEl = document.querySelector<HTMLImageElement>(
    "#imgTagWrapperId img, #main-image-container img",
  )

  const breadcrumbEls = Array.from(
    document.querySelectorAll("#wayfinding-breadcrumbs_container ul li a"),
  )
  const categoryPath = breadcrumbEls
    .map((el) => getText(el))
    .filter((t): t is string => Boolean(t))

  const asin = getASINFromUrl(window.location)

  return {
    source: "product",
    asin,
    title,
    price,
    currency,
    brand,
    imageUrl: imageEl?.src,
    categoryPath,
    raw: {
      url: window.location.href,
    },
  }
}

function getCartContext(): CartContext | undefined {
  const itemEls = Array.from(
    document.querySelectorAll<HTMLElement>(
      "#sc-active-cart .sc-list-item, .sc-list-item-content",
    ),
  )
  if (!itemEls.length) return undefined

  const items: ProductContext[] = []

  for (const el of itemEls) {
    const titleEl =
      el.querySelector(
        "span.sc-product-title, span.a-truncate-full, span.a-truncate-cut",
      ) ?? el.querySelector("a span.a-truncate-full")
    const title = getText(titleEl)
    if (!title) continue

    const priceEl =
      el.querySelector(".sc-product-price") ??
      el.querySelector(".a-price .a-offscreen")
    const priceText = getText(priceEl)
    const { value: price, currency } = parsePrice(priceText)

    const qtyEl = el.querySelector("span.a-dropdown-prompt")
    const qtyText = getText(qtyEl)
    const quantity = qtyText ? Number(qtyText.replace(/[^\d]/g, "")) : undefined

    const imageEl = el.querySelector<HTMLImageElement>("img.sc-product-image")

    const asinAttr =
      el.getAttribute("data-asin") ?? el.getAttribute("data-itemid") ?? undefined

    items.push({
      source: "cart",
      asin: asinAttr || undefined,
      title,
      price,
      currency,
      quantity: Number.isNaN(quantity) ? undefined : quantity,
      imageUrl: imageEl?.src,
      raw: {
        url: window.location.href,
      },
    })
  }

  if (!items.length) return undefined
  return { items }
}

function mapPreferencesToUserPrefs(prefs: Preferences): UserPreferences {
  return {
    footprintSensitivity: prefs.footprintSensitivity,
  }
}

function ensureSuggestionsContainer(): HTMLElement {
  const existing = document.getElementById("ecooffset-suggestions")
  if (existing) return existing

  const container = document.createElement("div")
  container.id = "ecooffset-suggestions"
  container.style.borderRadius = "8px"
  container.style.border = "1px solid #d3e4d8"
  container.style.padding = "10px 12px"
  container.style.marginTop = "8px"
  container.style.background = "#f6fbf8"
  container.style.fontFamily =
    "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  container.style.fontSize = "13px"

  const target =
    document.getElementById("centerCol") ??
    document.querySelector("#ppd") ??
    document.querySelector("#twister") ??
    document.body
  target?.insertBefore(container, target.firstChild)
  return container
}

function renderProductSuggestions(
  context: ProductContext,
  data: Awaited<ReturnType<typeof requestAlternativeRecommendations>>,
) {
  const container = ensureSuggestionsContainer()
  container.innerHTML = ""

  if (!data.alternatives.length) {
    container.textContent =
      "EcoOffset could not find a clearly greener alternative for this product."
    return
  }

  const header = document.createElement("div")
  header.style.display = "flex"
  header.style.justifyContent = "space-between"
  header.style.alignItems = "center"
  header.style.marginBottom = "4px"

  const title = document.createElement("div")
  title.textContent = "Greener alternatives from EcoOffset"
  title.style.fontWeight = "600"
  title.style.color = "#1b4332"
  header.appendChild(title)

  container.appendChild(header)

  const list = document.createElement("div")
  list.style.display = "flex"
  list.style.flexDirection = "column"
  list.style.gap = "8px"

  for (const alt of data.alternatives) {
    const card = document.createElement("div")
    card.style.display = "flex"
    card.style.gap = "8px"
    card.style.alignItems = "flex-start"

    if (alt.imageUrl) {
      const img = document.createElement("img")
      img.src = alt.imageUrl
      img.alt = alt.title
      img.style.width = "40px"
      img.style.height = "40px"
      img.style.objectFit = "cover"
      img.style.borderRadius = "4px"
      card.appendChild(img)
    }

    const body = document.createElement("div")
    body.style.flex = "1"

    const altTitle = document.createElement("div")
    altTitle.textContent = alt.title
    altTitle.style.fontWeight = "500"
    altTitle.style.marginBottom = "2px"
    body.appendChild(altTitle)

    const reduction = document.createElement("div")
    reduction.textContent = `Estimated carbon reduction: ${alt.reductionPercent.toFixed(1)}%`
    reduction.style.fontSize = "12px"
    reduction.style.color = "#166534"
    body.appendChild(reduction)

    if (typeof alt.footprint.kgCO2e === "number") {
      const footprint = document.createElement("div")
      footprint.textContent = `Approx. ${alt.footprint.kgCO2e.toFixed(2)} kg CO₂e`
      footprint.style.fontSize = "11px"
      footprint.style.color = "#555"
      body.appendChild(footprint)
    }

    if (alt.reason) {
      const reason = document.createElement("div")
      reason.textContent = alt.reason
      reason.style.fontSize = "11px"
      reason.style.color = "#555"
      reason.style.marginTop = "2px"
      body.appendChild(reason)
    }

    const actions = document.createElement("div")
    actions.style.display = "flex"
    actions.style.gap = "6px"
    actions.style.marginTop = "4px"

    const viewLink = document.createElement("a")
    viewLink.textContent = "View alternative"
    viewLink.href = `https://www.amazon.com/s?k=${encodeURIComponent(alt.title)}`
    viewLink.target = "_blank"
    viewLink.rel = "noopener noreferrer"
    viewLink.style.fontSize = "12px"
    viewLink.style.color = "#2563eb"
    viewLink.addEventListener("click", () => {
      recordEvent({
        type: "suggestion_clicked",
        alternativeId: alt.id,
        timestamp: Date.now(),
        pageUrl: window.location.href,
        context: context.source,
      })
    })
    actions.appendChild(viewLink)

    const dismiss = document.createElement("button")
    dismiss.type = "button"
    dismiss.textContent = "Not relevant"
    dismiss.style.fontSize = "11px"
    dismiss.style.padding = "2px 6px"
    dismiss.style.borderRadius = "999px"
    dismiss.style.border = "1px solid #d4d4d8"
    dismiss.style.background = "#f9fafb"
    dismiss.style.cursor = "pointer"
    dismiss.addEventListener("click", () => {
      card.remove()
      recordEvent({
        type: "suggestion_dismissed",
        alternativeId: alt.id,
        timestamp: Date.now(),
        pageUrl: window.location.href,
        context: context.source,
      })
    })
    actions.appendChild(dismiss)

    body.appendChild(actions)
    card.appendChild(body)
    list.appendChild(card)

    recordEvent({
      type: "suggestion_shown",
      alternativeId: alt.id,
      timestamp: Date.now(),
      pageUrl: window.location.href,
      context: context.source,
    })
  }

  container.appendChild(list)
}

async function detectAndRenderContext() {
  const prefs = await loadPreferences()
  if (!prefs.suggestAlternatives) return

  if (isProductDetailPage(window.location)) {
    const ctx = getProductContextFromPDP()
    if (!ctx) return

    const recommendationContext: RecommendationContext = {
      contextType: "product",
      product: {
        asin: ctx.asin,
        title: ctx.title,
        brand: ctx.brand,
        price: ctx.price,
        currency: ctx.currency,
        categoryPath: ctx.categoryPath,
      },
      userPreferences: mapPreferencesToUserPrefs(prefs),
    }

    const response = await requestAlternativeRecommendations(recommendationContext)
    renderProductSuggestions(ctx, response)
    return
  }

  if (isCartOrCheckoutPage(window.location)) {
    const ctx = getCartContext()
    if (!ctx || !ctx.items.length) return

    const first = ctx.items[0]
    const recommendationContext: RecommendationContext = {
      contextType: "cart",
      cartItems: ctx.items.map((item) => ({
        asin: item.asin,
        title: item.title,
        brand: item.brand,
        price: item.price,
        currency: item.currency,
        categoryPath: item.categoryPath,
      })),
      userPreferences: mapPreferencesToUserPrefs(prefs),
    }

    const response = await requestAlternativeRecommendations(recommendationContext)
    renderProductSuggestions(first, response)
  }
}

// Initial detection on load.
void detectAndRenderContext()

// Re-detect when Amazon dynamically replaces main content (SPA-like behavior).
const observer = new MutationObserver((mutations) => {
  const significantChange = mutations.some((m) => m.addedNodes.length > 0)
  if (significantChange) {
    void detectAndRenderContext()
  }
})

observer.observe(document.body, { childList: true, subtree: true })

