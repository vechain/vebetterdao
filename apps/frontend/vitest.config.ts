/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { resolve } from "path"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
      provider: "istanbul", // or 'v8'
      reporter: ["lcov"],
    },
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(__dirname, "test/vite.setup.ts")],
  },
})
