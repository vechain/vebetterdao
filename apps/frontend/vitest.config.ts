/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { resolve } from "path"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    server: {
      deps: {
        inline: ["react-tweet", "@chakra-ui/next-js"],
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
