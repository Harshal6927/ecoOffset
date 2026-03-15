/**
 * Mock analysis service.
 *
 * Detects product categories from keywords in the product name, then returns
 * pre-defined eco-impact data and alternatives appropriate for that category.
 *
 * Replace this with an LLM-backed implementation (implementing AnalysisService)
 * and swap it in content.ts — no other code needs to change.
 */
import type { Alternative, AnalysisResult, EcoImpact, Product } from "../types"
import type { AnalysisService } from "./index"

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

/** Container for all pre-defined eco data associated with a product category. */
interface CategoryData {
  ecoImpact: EcoImpact
  alternatives: Alternative[]
  tips: string[]
}

type Category = "electronics" | "clothing" | "furniture" | "food" | "beauty" | "toys" | "books" | "sports" | "home_appliance" | "generic"

/**
 * Keyword lists used to detect a product's category.
 * "generic" is intentionally excluded — it is the catch-all fallback returned
 * when no keyword in any other category matches.
 *
 * Matching strategy: case-insensitive substring search. The first category
 * whose keyword list contains any substring of the product name wins.
 */
const CATEGORY_KEYWORDS: Record<Exclude<Category, "generic">, string[]> = {
  electronics: [
    "laptop",
    "computer",
    "phone",
    "smartphone",
    "tablet",
    "monitor",
    "keyboard",
    "mouse",
    "headphone",
    "earphone",
    "speaker",
    "camera",
    "tv",
    "television",
    "charger",
    "battery",
    "cable",
    "printer",
    "scanner",
    "router",
    "console",
    "gaming",
    "gpu",
    "cpu",
    "ssd",
    "hard drive",
    "smartwatch",
    "wearable",
    "drone",
  ],
  clothing: [
    "shirt",
    "t-shirt",
    "tshirt",
    "jeans",
    "pants",
    "trousers",
    "dress",
    "jacket",
    "coat",
    "hoodie",
    "sweater",
    "socks",
    "underwear",
    "bra",
    "shoes",
    "sneakers",
    "boots",
    "sandals",
    "hat",
    "cap",
    "scarf",
    "gloves",
    "suit",
    "shorts",
    "leggings",
    "yoga",
  ],
  furniture: [
    "chair",
    "desk",
    "table",
    "sofa",
    "couch",
    "bed",
    "mattress",
    "bookshelf",
    "bookcase",
    "wardrobe",
    "cabinet",
    "drawer",
    "shelf",
    "lamp",
    "lighting",
    "rug",
    "carpet",
    "curtain",
    "pillow",
    "cushion",
  ],
  food: [
    "food",
    "snack",
    "coffee",
    "tea",
    "chocolate",
    "protein",
    "supplement",
    "vitamin",
    "nuts",
    "cereal",
    "pasta",
    "rice",
    "sauce",
    "spice",
    "drink",
    "beverage",
    "water bottle",
    "meal",
  ],
  beauty: [
    "shampoo",
    "conditioner",
    "soap",
    "lotion",
    "cream",
    "moisturizer",
    "sunscreen",
    "makeup",
    "lipstick",
    "foundation",
    "mascara",
    "perfume",
    "deodorant",
    "toothbrush",
    "toothpaste",
    "razor",
    "skincare",
    "serum",
    "toner",
    "face wash",
  ],
  toys: ["toy", "lego", "puzzle", "doll", "action figure", "board game", "card game", "stuffed", "plush", "building block", "remote control", "rc car"],
  books: ["book", "novel", "textbook", "guide", "manual", "cookbook", "dictionary", "encyclopedia", "journal", "planner", "notebook"],
  sports: [
    "bike",
    "bicycle",
    "treadmill",
    "dumbbell",
    "weight",
    "yoga mat",
    "tennis",
    "basketball",
    "football",
    "swimming",
    "hiking",
    "camping",
    "fishing",
    "golf",
    "cycling",
    "gym",
    "fitness",
    "workout",
    "exercise",
    "resistance band",
  ],
  home_appliance: [
    "vacuum",
    "blender",
    "microwave",
    "kettle",
    "toaster",
    "coffee maker",
    "air purifier",
    "humidifier",
    "fan",
    "heater",
    "iron",
    "washing machine",
    "dryer",
    "dishwasher",
    "refrigerator",
    "fridge",
    "oven",
  ],
}

// ---------------------------------------------------------------------------
// Per-category eco data
// Static scores and copy — replace with LLM-generated values when integrating
// a real analysis service.
// ---------------------------------------------------------------------------

const CATEGORY_DATA: Record<Category, CategoryData> = {
  electronics: {
    ecoImpact: {
      carbonKgCo2eq: 45.0,
      waterScore: 55,
      recyclablePercent: 20,
      summary: "Electronics have a high environmental footprint due to rare-earth mineral mining, energy-intensive manufacturing, and e-waste at end of life.",
    },
    alternatives: [
      {
        name: "Refurbished / certified pre-owned electronics",
        reason: "Buying refurbished extends a device's life and avoids the full manufacturing carbon cost — typically 70% lower emissions.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=refurbished+electronics&LH_ItemCondition=2000",
      },
      {
        name: "Energy Star certified equivalent",
        reason: "Energy Star products use 10–50% less energy, reducing your operational carbon footprint over the device's lifetime.",
        searchUrl: "https://www.amazon.com/s?k=energy+star+certified+electronics",
      },
    ],
    tips: [
      "Extend the device's life with a protective case and proper maintenance instead of upgrading early.",
      "Recycle old electronics at a certified e-waste facility (e.g. Best Buy drop-off or local e-waste programs).",
      "Enable power-saving modes to reduce energy consumption during use.",
      "Look for products with a longer manufacturer warranty — they're built to last.",
    ],
  },

  clothing: {
    ecoImpact: {
      carbonKgCo2eq: 22.0,
      waterScore: 88,
      recyclablePercent: 35,
      summary: "The fashion industry is one of the largest water consumers globally. Synthetic fabrics shed microplastics, and fast-fashion contributes heavily to textile waste.",
    },
    alternatives: [
      {
        name: "Organic cotton or linen equivalent",
        reason: "Organic cotton uses 91% less water than conventional cotton and avoids synthetic pesticides.",
        searchUrl: "https://www.amazon.com/s?k=organic+cotton+clothing",
      },
      {
        name: "Second-hand / vintage clothing",
        reason: "Buying pre-owned eliminates the production footprint entirely — the most sustainable choice for any garment.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=vintage+clothing&LH_ItemCondition=3000",
      },
    ],
    tips: [
      "Wash clothes in cold water — 90% of the energy used by washing machines goes to heating water.",
      "Air-dry instead of using a tumble dryer to save energy and extend fabric life.",
      "Choose quality over quantity — one well-made garment lasts longer than three fast-fashion items.",
      "Use a Guppyfriend washing bag to catch microplastic fibres from synthetic fabrics.",
    ],
  },

  furniture: {
    ecoImpact: {
      carbonKgCo2eq: 18.0,
      waterScore: 42,
      recyclablePercent: 45,
      summary:
        "Furniture production drives deforestation when non-certified wood is used. Flat-pack designs reduce transport emissions but generate composite wood waste at end of life.",
    },
    alternatives: [
      {
        name: "FSC-certified solid wood furniture",
        reason: "FSC certification ensures the wood is sourced from responsibly managed forests that protect biodiversity.",
        searchUrl: "https://www.amazon.com/s?k=FSC+certified+furniture",
      },
      {
        name: "Second-hand or upcycled furniture",
        reason: "Pre-owned furniture avoids new production entirely and keeps usable items out of landfill.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=second+hand+furniture&LH_ItemCondition=3000",
      },
    ],
    tips: [
      "Choose furniture made from solid wood or recycled materials over particleboard or MDF.",
      "Look for local manufacturers to reduce transport emissions.",
      "Repair and refinish old furniture before replacing it.",
      "Donate unwanted furniture to charity shops or list on local resale platforms.",
    ],
  },

  food: {
    ecoImpact: {
      carbonKgCo2eq: 8.0,
      waterScore: 60,
      recyclablePercent: 60,
      summary: "Food's environmental impact varies significantly by type. Packaging is a major contributor to plastic waste, and supply chains add transport emissions.",
    },
    alternatives: [
      {
        name: "Organic certified equivalent",
        reason: "Organic farming avoids synthetic pesticides and fertilisers, protecting soil health and biodiversity.",
        searchUrl: "https://www.amazon.com/s?k=organic+food",
      },
      {
        name: "Locally produced / fair-trade option",
        reason: "Shorter supply chains mean lower transport emissions, and fair-trade ensures ethical production standards.",
        searchUrl: "https://www.amazon.com/s?k=fair+trade+food",
      },
    ],
    tips: [
      "Choose products with minimal or recyclable packaging.",
      "Buy in bulk to reduce packaging-to-product ratio.",
      "Store food properly to minimise waste.",
      "Compost food scraps instead of sending them to landfill.",
    ],
  },

  beauty: {
    ecoImpact: {
      carbonKgCo2eq: 12.0,
      waterScore: 65,
      recyclablePercent: 30,
      summary: "Beauty products often use single-use plastic packaging and may contain microbeads or synthetic chemicals that persist in waterways.",
    },
    alternatives: [
      {
        name: "Refillable or zero-waste beauty alternative",
        reason: "Refillable formats cut plastic packaging by up to 80% over a product's lifetime.",
        searchUrl: "https://www.amazon.com/s?k=zero+waste+beauty+refillable",
      },
      {
        name: "Natural or organic beauty product",
        reason: "Certified natural formulas avoid synthetic chemicals that can accumulate in aquatic ecosystems.",
        searchUrl: "https://www.amazon.com/s?k=organic+natural+beauty+cruelty+free",
      },
    ],
    tips: [
      "Look for products certified by Ecocert, COSMOS Organic, or Leaping Bunny.",
      "Choose solid bars (shampoo, soap) over liquid products in plastic bottles.",
      "Use concentrated formulas that require less packaging per wash.",
      "Recycle empty beauty containers through schemes like TerraCycle.",
    ],
  },

  toys: {
    ecoImpact: {
      carbonKgCo2eq: 16.0,
      waterScore: 35,
      recyclablePercent: 25,
      summary: "Most toys are made from virgin plastics that take centuries to degrade. Battery-powered toys add e-waste, and toy trends lead to rapid disposal.",
    },
    alternatives: [
      {
        name: "Wooden or natural material toy",
        reason: "Sustainably sourced wooden toys are biodegradable, durable, and free from harmful plastics.",
        searchUrl: "https://www.amazon.com/s?k=wooden+toys+sustainable",
      },
      {
        name: "Second-hand toy",
        reason: "Pre-loved toys are fully functional and avoid all new production impacts.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=second+hand+toys&LH_ItemCondition=3000",
      },
    ],
    tips: [
      "Choose toys that grow with the child (open-ended play value) to avoid rapid replacement.",
      "Borrow or rent toys for short-term interest instead of buying.",
      "Donate outgrown toys to charity or toy libraries.",
      "Avoid battery-powered toys where possible — rechargeable alternatives are better when needed.",
    ],
  },

  books: {
    ecoImpact: {
      carbonKgCo2eq: 2.5,
      waterScore: 40,
      recyclablePercent: 80,
      summary: "Books have a relatively lower environmental impact compared to many products, but paper production still contributes to deforestation and water use.",
    },
    alternatives: [
      {
        name: "E-book or audiobook edition",
        reason: "Digital formats have near-zero marginal environmental cost after device production.",
        searchUrl: "https://www.amazon.com/s?k=ebook+kindle",
      },
      {
        name: "Second-hand book",
        reason: "Pre-owned books have no new production impact and are often significantly cheaper.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=used+books&LH_ItemCondition=3000",
      },
    ],
    tips: [
      "Borrow from a local library before purchasing.",
      "Share books with friends or join a book-swap community.",
      "Donate books you've finished reading instead of discarding them.",
      "Look for books printed on FSC-certified or recycled paper.",
    ],
  },

  sports: {
    ecoImpact: {
      carbonKgCo2eq: 14.0,
      waterScore: 48,
      recyclablePercent: 40,
      summary:
        "Sports equipment often uses synthetic materials and rubber with significant manufacturing footprints. Seasonal and trend-driven purchasing leads to premature disposal.",
    },
    alternatives: [
      {
        name: "Second-hand sports equipment",
        reason: "Sports gear is often lightly used — buying pre-owned eliminates new production impact entirely.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=second+hand+sports+equipment&LH_ItemCondition=3000",
      },
      {
        name: "Recycled material sports gear",
        reason: "Brands using recycled plastics (e.g. recycled PET) significantly reduce raw material extraction.",
        searchUrl: "https://www.amazon.com/s?k=recycled+material+sports+gear+sustainable",
      },
    ],
    tips: [
      "Rent or borrow equipment for activities you try occasionally before committing to purchase.",
      "Repair damaged equipment (e.g. re-grip rackets, patch bike tyres) before replacing.",
      "Choose multi-purpose gear that serves several activities.",
      "Look for brands with take-back or repair programmes.",
    ],
  },

  home_appliance: {
    ecoImpact: {
      carbonKgCo2eq: 35.0,
      waterScore: 50,
      recyclablePercent: 22,
      summary: "Home appliances have high embodied energy from manufacturing and contribute significant e-waste. Energy efficiency during use is a key factor in lifetime impact.",
    },
    alternatives: [
      {
        name: "Energy-efficient (A+++ rated) equivalent",
        reason: "A top-rated energy efficient appliance can use 50–70% less electricity over its lifetime versus a basic model.",
        searchUrl: "https://www.amazon.com/s?k=energy+efficient+appliance+A+rated",
      },
      {
        name: "Refurbished appliance",
        reason: "Certified refurbished appliances are tested to full function and avoid the full manufacturing footprint.",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=refurbished+appliance&LH_ItemCondition=2000",
      },
    ],
    tips: [
      "Check the energy label — each rating grade represents a significant difference in annual running costs and emissions.",
      "Only run dishwashers and washing machines with full loads.",
      "Use eco-mode settings where available.",
      "Recycle old appliances through the manufacturer's take-back scheme or local council collection.",
    ],
  },

  generic: {
    ecoImpact: {
      carbonKgCo2eq: 13.0,
      waterScore: 50,
      recyclablePercent: 40,
      summary: "Every product has an environmental footprint from raw material extraction, manufacturing, transport, and end-of-life disposal. Choosing wisely makes a difference.",
    },
    alternatives: [
      {
        name: "Second-hand version of this product",
        reason: "Buying pre-owned eliminates all new production impacts and is usually significantly cheaper.",
        searchUrl: `https://www.ebay.com/sch/i.html?_nkw=second+hand&LH_ItemCondition=3000`,
      },
      {
        name: "Locally sourced alternative",
        reason: "Locally produced goods have shorter supply chains, reducing transport emissions significantly.",
        searchUrl: "https://www.amazon.com/s?k=locally+made+sustainable",
      },
    ],
    tips: [
      "Ask: do I really need this? Avoiding unnecessary purchases is the most sustainable choice.",
      "Buy quality items that last longer rather than cheaper items that need frequent replacement.",
      "Research brands' sustainability commitments before purchasing.",
      "Recycle or donate the product at end of life instead of sending it to landfill.",
    ],
  },
}

// ---------------------------------------------------------------------------
// Category detection
// ---------------------------------------------------------------------------

/**
 * Maps a product name to its best-matching category using substring matching.
 *
 * Iterates CATEGORY_KEYWORDS in insertion order; the first category whose
 * keyword list contains any substring of `productName` (case-insensitive)
 * is returned. Returns "generic" when no keyword matches.
 *
 * @param productName - Raw product name string from the page.
 * @returns Matched category key, or "generic" as a catch-all fallback.
 */
function detectCategory(productName: string): Category {
  const lower = productName.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Exclude<Category, "generic">, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return "generic"
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

export class MockAnalysisService implements AnalysisService {
  async analyze(product: Product): Promise<AnalysisResult> {
    // Simulate a short async delay (as a real API call would have)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const category = detectCategory(product.name)
    const data = CATEGORY_DATA[category]

    // Category-level alternatives keep their pre-defined searchUrl values.
    // Only the product-specific alternative below uses the actual product name.
    const searchTerm = encodeURIComponent(product.name.slice(0, 60))
    const alternatives: Alternative[] = [
      {
        ...data.alternatives[0],
        searchUrl: data.alternatives[0].searchUrl,
      },
      {
        ...data.alternatives[1],
        searchUrl: data.alternatives[1].searchUrl,
      },
    ]

    // Prepend a product-specific search as the top suggestion.
    const productSpecificAlternative: Alternative = {
      name: `Eco-friendly ${product.name.slice(0, 50)}`,
      reason: `Search for a sustainable version of this exact product with eco certifications.`,
      searchUrl: `https://www.amazon.com/s?k=eco+friendly+sustainable+${searchTerm}`,
    }

    return {
      product,
      ecoImpact: data.ecoImpact,
      alternatives: [productSpecificAlternative, ...alternatives],
      tips: data.tips,
    }
  }
}
