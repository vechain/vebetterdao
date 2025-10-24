import type { StorybookConfig } from "@storybook/nextjs-vite"

import { join, dirname, resolve } from "path"
// import svgr from "vite-plugin-svgr"

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")))
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
    viteConfig.logLevel = "silent"

    // 1) Keep Node-only packages out of the browser pre-bundle
    viteConfig.optimizeDeps.exclude.push("next/dist/compiled/gzip-size")

    // 2) Replace the Node-only module with an empty shim for preview
    viteConfig.resolve.alias["next/dist/compiled/gzip-size"] = resolve(__dirname, "mocks/empty.ts")

    // Mock @repo/config for Storybook
    viteConfig.resolve.alias["@repo/config"] = resolve(__dirname, "mocks/config.ts")

    // Mock @vechain/vechain-kit for Storybook
    viteConfig.resolve.alias["@vechain/vechain-kit"] = resolve(__dirname, "mocks/vechain-kit.tsx")

    // Mock thor-devkit for Storybook (uses Node crypto)
    viteConfig.resolve.alias["thor-devkit"] = resolve(__dirname, "mocks/thor-devkit.ts")

    // 3) Guardrails: if anything still tries to pull Node built-ins, stub them
    // (better to fail silently than crash)
    for (const builtin of ["fs", "stream", "path", "zlib"]) {
      viteConfig.resolve.alias[builtin] = resolve(__dirname, "mocks/empty.ts")
    }

    // Mock crypto with browser-compatible implementation
    viteConfig.resolve.alias["crypto"] = resolve(__dirname, "mocks/crypto.ts")

    // 4) Ensure SSR pipeline doesn’t try to externalize the module either
    const noExt = viteConfig.ssr.noExternal
    viteConfig.ssr.noExternal = Array.isArray(noExt)
      ? [...noExt, /next\/dist\/compiled\/gzip-size/]
      : [/next\/dist\/compiled\/gzip-size/]

    return viteConfig
  },
}
export default config
