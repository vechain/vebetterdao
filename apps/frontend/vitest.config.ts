/// <reference types="vitest" />
import { UserConfig, defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { resolve } from "path"

export default defineConfig({
  plugins: [react(), tsconfigPaths()] as UserConfig["plugins"],
  test: {
    server: {
      deps: {
        inline: ["react-tweet"],
      },
    },
    coverage: {
      provider: "istanbul", // or 'v8'
      reporter: ["lcov"],
    },
    environment: "happy-dom",
    globals: true,
    setupFiles: [resolve(__dirname, "test/vite.setup.ts")],
  },
})
