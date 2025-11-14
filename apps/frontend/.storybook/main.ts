// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import type { StorybookConfig } from "@storybook/nextjs-vite"

import { join, dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")))
}

/**
 * Vite plugin to redirect contract imports to mocks
 */
function mockContractsPlugin() {
  const contractsMockPath = resolve(__dirname, "../__mocks__/@vechain/vebetterdao-contracts.ts")

  return {
    name: "mock-contracts",
    resolveId(id: string) {
      if (id.startsWith("@vechain/vebetterdao-contracts/")) {
        return contractsMockPath
      }
      if (id === "@vechain/vebetterdao-contracts") {
        return contractsMockPath
      }
      return null
    },
  }
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "!../**/node_modules/**",
    "!../dist/**",
    "!../build/**",
  ],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-mcp"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/nextjs-vite"),
    options: {},
  },
  staticDirs: ["../public"],
  async viteFinal(viteConfig) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import("vite")

    const apiHooksMock = resolve(__dirname, "../src/api/__mocks__/hooks.ts")
    const noExt = viteConfig.ssr?.noExternal

    return mergeConfig(viteConfig, {
      resolve: {
        alias: {
          "next/dist/compiled/gzip-size": resolve(__dirname, "mocks/empty.ts"),
          "@repo/config": resolve(__dirname, "../__mocks__/@repo/config.ts"),
          "@vechain/vechain-kit": resolve(__dirname, "../__mocks__/@vechain/vechain-kit.tsx"),
          "@vechain/picasso": resolve(__dirname, "../__mocks__/@vechain/picasso.ts"),
          "thor-devkit": resolve(__dirname, "../__mocks__/thor-devkit.ts"),
          openai: resolve(__dirname, "../__mocks__/openai.ts"),
          crypto: resolve(__dirname, "../__mocks__/crypto.ts"),
          fs: resolve(__dirname, "../__mocks__/fs.ts"),
          stream: resolve(__dirname, "../__mocks__/stream.ts"),
          path: resolve(__dirname, "../__mocks__/path.ts"),
          zlib: resolve(__dirname, "../__mocks__/zlib.ts"),
          [resolve(__dirname, "../src/api/indexer/sustainability/useUserScore.ts")]: apiHooksMock,
          [resolve(__dirname, "../src/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId.ts")]: apiHooksMock,
          [resolve(__dirname, "../src/api/contracts/xApps/hooks/useXApps.ts")]: apiHooksMock,
          [resolve(__dirname, "../src/api/contracts/xApps/hooks/useUserSignalEvents.ts")]: apiHooksMock,
          [resolve(__dirname, "../src/hooks/useTransak.ts")]: apiHooksMock,
          [resolve(__dirname, "../src/api/indexer/actions/useUserActionLeaderboard.ts")]: apiHooksMock,
          [resolve(__dirname, "../src/api/indexer/actions/useUserActionOverview.ts")]: apiHooksMock,
        },
      },
      optimizeDeps: {
        exclude: ["next/dist/compiled/gzip-size"],
      },
      ssr: {
        noExternal: Array.isArray(noExt)
          ? [...noExt, /next\/dist\/compiled\/gzip-size/]
          : [/next\/dist\/compiled\/gzip-size/],
      },
      plugins: [mockContractsPlugin()],
      logLevel: "silent",
    })
  },
}
export default config
