# AGENTS.md

Guidance for coding agents working in this repository.

## Project Snapshot

- Project: `EcoOffset` Chrome extension (Manifest V3)
- Language/tooling: TypeScript, React (popup), Vite, Tailwind CSS v4, Biome
- Runtime contexts:
  - Popup UI (`popup/index.html` + `src/popup/*`)
  - Content script (`src/content.ts`)
  - Background service worker (`src/background.ts`)

## Source of Truth for Rules

- Checked for Cursor rules: `.cursor/rules/` and `.cursorrules` -> not present
- Checked for Copilot rules: `.github/copilot-instructions.md` -> not present
- Therefore, this file + repo config files are the active guidance.

## Environment and Setup

- Node.js: v22+ (see `README.md`)
- Install deps: `npm install`
- Husky hooks are installed via `prepare` script on install.

## Build, Lint, Format, Test Commands

- Install dependencies:
  - `npm install`
- Development watch (all extension targets):
  - `npm run dev`
- Production build (popup + content + background):
  - `npm run build`
- Preview build output:
  - `npm run preview`
- Lint (Biome check, auto-fix enabled):
  - `npm run lint`
- Format (Biome format, auto-fix enabled):
  - `npm run format`
- Type-check only (no dedicated npm script, run directly):
  - `npx tsc --noEmit`

### Test Status (Important)

- There is currently **no test runner configured** (no Jest/Vitest/Playwright scripts).
- There are currently **no `*.test.*` or `*.spec.*` files** in the repo.
- CI currently runs lint + format only (`.github/workflows/lint.yml`).

### Single Test Execution

- Not available in current repo state because no test framework is set up.
- If a framework is added later, use its file-scoped command. Example (Vitest):
  - `npx vitest run path/to/file.test.ts`
  - Single case by name: `npx vitest run path/to/file.test.ts -t "test name"`

## Git Hooks and Commit Rules

- Pre-commit hook (`.husky/pre-commit`) runs:
  - `npm run lint`
  - `npm run format`
- Commit message hook (`.husky/commit-msg`) runs commitlint.
- Commit format should follow Conventional Commits:
  - `<type>(<scope>): <description>`
  - Example: `feat(platforms): add walmart adapter`

## Repository Structure

- `src/content.ts`: content-script entrypoint; injects badge and panel into product pages
- `src/background.ts`: message handler + LLM/mock analysis orchestration
- `src/analysis/*`: analysis service abstraction + implementations
- `src/platforms/*`: platform adapters (URL match, product extraction, injection point)
- `src/ui/*`: Shadow DOM UI widgets for in-page badge/panel
- `src/popup/*`: React popup app
- `src/types/index.ts`: shared domain/message contracts
- `public/manifest.json`: extension permissions + content script matches
- `vite.config.ts`: multi-target build selection via `BUILD_TARGET`

## Code Style and Conventions

### Formatting and Imports

- Formatter/linter: Biome (`biome.json`)
- Indentation: 2 spaces
- Quotes: double quotes
- Semicolons: as-needed (omit unless required)
- Line endings: LF
- Imports are auto-organized by Biome assist (`source.organizeImports = on`)
- Prefer `import type` for type-only imports
- Use relative imports (no path alias system configured)

### TypeScript Practices

- `tsconfig` uses `strict: true`; keep code strict-safe
- Avoid `any`; model contracts with explicit interfaces/types
- Shared contracts belong in `src/types/index.ts`
- Use discriminated unions for extension message protocol (`type` field)
- Narrow `unknown`/union types before use
- Prefer explicit return types for exported/public functions when clarity helps

### Naming

- Components/classes/interfaces/types: `PascalCase`
- Variables/functions/methods/hooks: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for module-level constants
- Files: lowercase, usually kebab-case for multiword (`detail-panel.ts`)
- Platform adapters follow `<PlatformName>Platform` class naming

### Error Handling

- Favor graceful degradation in extension runtime:
  - Content script catches message failures and returns `null` result
  - Background service falls back from LLM to mock service
  - Return structured `ERROR` messages for unrecoverable failures
- Avoid throwing from UI paths unless caller handles it
- Log with actionable context for debugging (`console.warn`/`console.error`)

### Extension-Specific Patterns

- Keep in-page UI isolated via Shadow DOM (see `src/ui/*`)
- Preserve SPA-navigation resilience:
  - URL change detection + reinjection guards in content script
- Message passing:
  - Content -> background via `chrome.runtime.sendMessage`
  - For async responses in background listeners, return `true`
- Do not break manifest permissions/matches when adding features

### React/Popup Conventions

- Popup uses functional components and hooks
- Keep popup-specific styles in Tailwind classes + `src/style.css`
- Keep popup platform-detection list in sync with platform adapters

## Feature Workflows

### Adding a New Shopping Platform

1. Create `src/platforms/<name>.ts` implementing `Platform`
2. Register adapter in `src/platforms/index.ts`
3. Add domain to `public/manifest.json`:
   - `host_permissions`
   - `content_scripts.matches`
4. Update `SUPPORTED_PLATFORMS` in `src/popup/Popup.tsx`

### Changing Analysis Behavior

- `AnalysisService` interface is the seam (`src/analysis/index.ts`)
- LLM implementation lives in `src/analysis/llm.ts`
- Mock fallback logic in `src/background.ts` should remain robust
- Keep response parsing defensive (sanitize, clamp, validate)

## Validation Checklist for Agents

Before finishing code changes, run:

1. `npm run build`
2. `npm run lint`
3. `npm run format`
4. `npx tsc --noEmit`

If you touched extension behavior, also verify manually in Chrome:

- Load unpacked extension from `dist/`
- Open a supported product page
- Confirm badge injection, panel open/close, and SPA re-navigation behavior

## Notes for Agentic Edits

- Prefer small, targeted patches that preserve existing architecture.
- Keep comments concise and only where logic is non-obvious.
- Do not introduce new dependencies or tooling unless task requires it.
- If adding tests, also add npm scripts and update this file with exact single-test commands.
