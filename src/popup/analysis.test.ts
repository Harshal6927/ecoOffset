import assert from "node:assert/strict"
import { getOffsetSuggestions } from "./carbonSuggestions.ts"
import { analyzeProductCarbonImpact } from "./productCarbonAnalysis.ts"
import { extractProductTitleFromUrl, isProbablyUrl } from "./productParsing.ts"

type TestCase = {
  name: string
  run: () => void
}

const testCases: TestCase[] = [
  {
    name: "plain product names are not mistaken for URLs",
    run: () => {
      assert.equal(isProbablyUrl("plastic bottle"), false)
      assert.equal(isProbablyUrl("amazon.com/product/test"), true)
    },
  },
  {
    name: "typed product names produce a carbon estimate with visible assumptions",
    run: () => {
      const result = analyzeProductCarbonImpact({
        productName: "Imported plastic bottle pack of 24",
        productUrl: "",
      })

      assert.ok(result)
      assert.equal(result.productName, "Imported plastic bottle pack of 24")
      assert.ok(result.estimatedKgCO2e > 0)
      assert.ok(result.contributors.length > 0)
      assert.ok(result.assumptions.length > 0)
      assert.ok(result.methodology.length > 0)
      assert.ok(result.impactComparisons.length > 0)
    },
  },
  {
    name: "amazon-style URLs can extract a readable product title",
    run: () => {
      const title = extractProductTitleFromUrl("https://www.amazon.com/IRON-FLASK-Sports-Water-Bottle/dp/B07F6M6ZB4")

      assert.equal(title, "IRON FLASK Sports Water Bottle")
    },
  },
  {
    name: "offset suggestions convert positive emissions into practical actions",
    run: () => {
      const suggestions = getOffsetSuggestions(95)

      assert.ok(suggestions)
      assert.match(suggestions.treeRange, /tree/)
      assert.equal(suggestions.suggestions.length, 3)
      assert.match(suggestions.suggestions[2]?.label ?? "", /verified carbon credits/i)
    },
  },
  {
    name: "offset suggestions safely reject invalid or zero emissions",
    run: () => {
      assert.equal(getOffsetSuggestions(0), null)
      assert.equal(getOffsetSuggestions(null), null)
      assert.equal(getOffsetSuggestions(undefined), null)
    },
  },
]

let hasFailure = false

for (const testCase of testCases) {
  try {
    testCase.run()
    console.log(`PASS ${testCase.name}`)
  } catch (error) {
    hasFailure = true
    console.error(`FAIL ${testCase.name}`)
    console.error(error)
  }
}

if (hasFailure) {
  process.exitCode = 1
}
