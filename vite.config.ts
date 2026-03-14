import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/**
 * Multi-target build configuration.
 *
 * Set BUILD_TARGET env variable to select which artifact to build:
 *   BUILD_TARGET=popup      → React popup UI (default)
 *   BUILD_TARGET=content    → Content script (IIFE, injected into shopping pages)
 *   BUILD_TARGET=background → Background service worker (IIFE)
 *
 * The `build` npm script runs all three targets in sequence.
 */
const target = process.env.BUILD_TARGET ?? "popup"

/**
 * In watch mode all three Vite processes start in parallel.
 * Only the popup config has emptyOutDir:true by default, which would wipe
 * content.js / background.js written by the other two watchers (race condition).
 * When --watch is active we disable emptyOutDir for every config;
 * `npm run dev` does a clean sequential build first, then starts the watchers.
 */
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w")

// ---------------------------------------------------------------------------
// Popup — React + Tailwind, HTML entry point
// ---------------------------------------------------------------------------
const popupConfig = defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: !isWatch, // clear dist on a fresh build, never during watch
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/index.html"),
      },
      output: {
        entryFileNames: "[name]/[name].js",
        chunkFileNames: "[name]/[name].js",
        assetFileNames: "[name]/[name].[ext]",
      },
    },
  },
})

// ---------------------------------------------------------------------------
// Content script — IIFE (required for manifest-declared content scripts)
// ---------------------------------------------------------------------------
const contentConfig = defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/content.ts"),
      formats: ["iife"],
      name: "EcoOffsetContent",
      fileName: () => "content.js",
    },
  },
})

// ---------------------------------------------------------------------------
// Background service worker — IIFE, runs in its own isolated scope
// ---------------------------------------------------------------------------
const backgroundConfig = defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/background.ts"),
      formats: ["iife"],
      name: "EcoOffsetBackground",
      fileName: () => "background.js",
    },
  },
})

const configs: Record<string, ReturnType<typeof defineConfig>> = {
  popup: popupConfig,
  content: contentConfig,
  background: backgroundConfig,
}

export default configs[target] ?? popupConfig
