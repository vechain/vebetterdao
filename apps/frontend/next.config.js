/** @type {import('next').NextConfig} */

const removeImports = require("next-remove-imports")()
module.exports = removeImports({})

// next.config.js
if (typeof self === "undefined") {
  global.self = global
}

const nextConfig = {
  transpilePackages: ["@repo/contracts"],
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
}

module.exports = nextConfig
