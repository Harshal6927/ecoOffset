# EcoOffset

A Chrome extension that helps users make sustainable choices while shopping online.

## Prerequisites

- [Node.js](https://nodejs.org/) v22+

## Setup

```bash
npm install
```

This also sets up [Husky](https://typicode.github.io/husky/) git hooks automatically via the `prepare` script.

## Development

```bash
npm run dev
```

Runs a clean build then starts three file-watchers (popup, content script, background worker) that rebuild their respective outputs into `dist/` on every change.

Load the extension in Chrome once:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` folder

After each rebuild, click the **reload icon** on the extension card in `chrome://extensions` to pick up the latest changes.

## Build

```bash
npm run build
```

Produces a production-ready bundle in `dist/`.

## Adding a platform

The extension uses a simple adapter pattern. Adding a new shopping site requires touching two files.

**1. Create `src/platforms/<name>.ts`**

```ts
import type { Platform } from "./platform"

export class MyShopPlatform implements Platform {
  readonly id = "myshop"
  readonly displayName = "MyShop"

  // Return true when the current URL belongs to this site
  matchesUrl(url: string): boolean {
    return /myshop\.[a-z.]+/i.test(url)
  }

  // Return the product name from the DOM, or null if not on a product page
  getProductName(): string | null {
    const el = document.querySelector("h1.product-title")
    return el?.textContent?.trim() ?? null
  }

  // Return the element the eco-badge should be inserted after
  getInjectionPoint(): Element | null {
    return document.querySelector("h1.product-title")
  }
}
```

**2. Register it in `src/platforms/index.ts`**

```ts
import { MyShopPlatform } from "./myshop"

const PLATFORMS: Platform[] = [
  new AmazonPlatform(),
  new EbayPlatform(),
  new MyShopPlatform(), // ← add here
]
```

**3. Update `public/manifest.json`**

Add the new domain to both `host_permissions` and `content_scripts.matches`:

```json
"host_permissions": ["*://*.myshop.com/*"],
"content_scripts": [{ "matches": ["*://*.myshop.com/*"], ... }]
```

Also update the `SUPPORTED_PLATFORMS` list in `src/popup/Popup.tsx` so the popup correctly reports the active platform.

## Swapping in real LLM analysis

Product analysis is behind the `AnalysisService` interface (`src/analysis/index.ts`). The current implementation (`src/analysis/mock.ts`) returns category-based mock data.

To integrate a real LLM:

1. Create `src/analysis/llm.ts` implementing `AnalysisService`.
2. In `src/content.ts`, replace `new MockAnalysisService()` with your implementation.
3. For API key security, move the `analyze()` call into `src/background.ts` and use `chrome.runtime.sendMessage` — the message plumbing is already scaffolded there.

## Code Quality

[Biome](https://biomejs.dev/) handles both linting and formatting.

```bash
# Lint (auto-fix)
npm run lint

# Format (auto-fix)
npm run format
```

Husky runs both automatically on `git commit`. The CI workflow (`.github/workflows/lint.yml`) also runs them on every push and pull request.

## Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Commit messages are validated automatically by the `commit-msg` Husky hook via [commitlint](https://commitlint.js.org/).

**Format:** `<type>(<scope>): <description>`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code change that is neither a fix nor a feature |
| `chore` | Build process, dependency updates, tooling |
| `revert` | Reverts a previous commit |

**Examples:**

```
feat(platforms): add Walmart platform adapter
fix(content): handle SPA navigation on eBay
chore: upgrade tailwind to v4.3
```

## License

[Apache 2.0](LICENSE)
