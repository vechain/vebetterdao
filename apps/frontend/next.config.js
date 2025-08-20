/** @type {import('next').NextConfig} */

// Global self polyfill for environments where it's not defined
if (typeof self === "undefined") {
  global.self = global
}

const nextConfig = {
  // Enable Turbopack for development
  experimental: {
    turbo: {
      rules: {
        // Handle SVG files with @svgr/webpack equivalent in Turbopack
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    optimizePackageImports: ["@chakra-ui/react"],
  },
  transpilePackages: ["@vechain-kit/vebetterdao-contracts", "@vechain/vechain-kit"],
}

module.exports = nextConfig
