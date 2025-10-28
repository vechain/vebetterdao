import type { StorybookConfig } from "@storybook/nextjs-vite"

import { join, dirname, resolve } from "path"

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
    viteConfig.resolve ??= {}
    viteConfig.resolve.alias ??= {}
    viteConfig.optimizeDeps ??= {}
    viteConfig.optimizeDeps.exclude ??= []
    viteConfig.ssr ??= {}
    viteConfig.plugins ??= []
    viteConfig.logLevel = "silent"

    viteConfig.optimizeDeps.exclude.push("next/dist/compiled/gzip-size")

    viteConfig.resolve.alias["next/dist/compiled/gzip-size"] = resolve(__dirname, "mocks/empty.ts")

    // Force Vite to use mocks for packages with Node.js dependencies
    viteConfig.resolve.alias["@repo/config"] = resolve(__dirname, "../__mocks__/@repo/config.ts")
    viteConfig.resolve.alias["@vechain/vechain-kit"] = resolve(__dirname, "../__mocks__/@vechain/vechain-kit.tsx")
    viteConfig.resolve.alias["thor-devkit"] = resolve(__dirname, "../__mocks__/thor-devkit.ts")
    viteConfig.resolve.alias["openai"] = resolve(__dirname, "../__mocks__/openai.ts")
    viteConfig.resolve.alias["crypto"] = resolve(__dirname, "../__mocks__/crypto.ts")
    viteConfig.resolve.alias["fs"] = resolve(__dirname, "../__mocks__/fs.ts")
    viteConfig.resolve.alias["stream"] = resolve(__dirname, "../__mocks__/stream.ts")
    viteConfig.resolve.alias["path"] = resolve(__dirname, "../__mocks__/path.ts")
    viteConfig.resolve.alias["zlib"] = resolve(__dirname, "../__mocks__/zlib.ts")

    // Mock local modules that have complex dependencies
    const apiHooksMock = resolve(__dirname, "../src/api/__mocks__/hooks.ts")
    viteConfig.resolve.alias[resolve(__dirname, "../src/api/indexer/sustainability/useUserScore.ts")] = apiHooksMock
    viteConfig.resolve.alias[
      resolve(__dirname, "../src/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId.ts")
    ] = apiHooksMock
    viteConfig.resolve.alias[resolve(__dirname, "../src/api/contracts/xApps/hooks/useXApps.ts")] = apiHooksMock
    viteConfig.resolve.alias[resolve(__dirname, "../src/api/contracts/xApps/hooks/useUserSignalEvents.ts")] =
      apiHooksMock
    viteConfig.resolve.alias[resolve(__dirname, "../src/hooks/useTransak.ts")] = apiHooksMock
    viteConfig.resolve.alias[resolve(__dirname, "../src/api/indexer/actions/useUserActionLeaderboard.ts")] =
      apiHooksMock
    viteConfig.resolve.alias[resolve(__dirname, "../src/api/indexer/actions/useUserActionOverview.ts")] = apiHooksMock

    // Add custom plugin to handle all contract imports
    viteConfig.plugins.push(mockContractsPlugin())

    const noExt = viteConfig.ssr.noExternal
    viteConfig.ssr.noExternal = Array.isArray(noExt)
      ? [...noExt, /next\/dist\/compiled\/gzip-size/]
      : [/next\/dist\/compiled\/gzip-size/]

    return viteConfig
  },
}
export default config
