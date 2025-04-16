/** @type {import('next').NextConfig} */

const removeImports = require("next-remove-imports")()
module.exports = removeImports({})

// next.config.js
if (typeof self === "undefined") {
  global.self = global
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const nextConfig = {
  transpilePackages: ["@repo/contracts"],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    })
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)
