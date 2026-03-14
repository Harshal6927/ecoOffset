import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
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
