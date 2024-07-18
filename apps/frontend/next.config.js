/** @type {import('next').NextConfig} */

const removeImports = require("next-remove-imports")()
module.exports = removeImports({})

// next.config.js
if (typeof self === "undefined") {
  global.self = global
}

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

module.exports = nextConfig
