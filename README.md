# EcoOffset

A Chrome browser extension built with React, TypeScript, Vite, and Tailwind CSS.

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [npm](https://www.npmjs.com/) v10+
- [Google Chrome](https://www.google.com/chrome/)

## Setup

```bash
npm install
```

This also sets up [Husky](https://typicode.github.io/husky/) git hooks automatically via the `prepare` script.

## Development

```bash
npm run dev
```

Watches for file changes and rebuilds the extension into `dist/` continuously.

After starting, load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `dist/` folder

To see changes after a rebuild, click the refresh icon on the extension card in `chrome://extensions`.

## Build

```bash
npm run build
```

Produces a production-ready bundle in `dist/`.

## Project Structure

```
ecoOffset/
├── .github/workflows/
│   └── lint.yml          # CI: lint & format checks on every push/PR
├── .husky/
│   ├── pre-commit        # Git hook: runs lint & format before every commit
│   └── commit-msg        # Git hook: validates commit message format
├── popup/
│   └── index.html        # HTML entry point for the popup
├── public/
│   └── manifest.json     # Chrome Extension Manifest V3
├── src/
│   ├── popup/
│   │   ├── main.tsx      # React root
│   │   └── Popup.tsx     # Popup component
│   └── style.css         # Global styles (Tailwind v4)
├── biome.json            # Biome linter & formatter config
├── commitlint.config.ts  # Conventional commits config
├── tsconfig.json
└── vite.config.ts
```

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
feat: add carbon offset calculator
fix: correct popup width on Windows
docs: update setup instructions
chore: upgrade tailwind to v4.3
```

## License

[Apache 2.0](LICENSE)
