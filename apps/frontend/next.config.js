/** @type {import('next').NextConfig} */

// Global self polyfill for environments where it's not defined
if (typeof self === "undefined") {
  global.self = global
}

const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "@vechain/vebetterdao-contracts",
      "@vechain/dapp-kit-react",
      "@vechain/vechain-kit",
      "@chakra-ui-react",
      "@vechain/vebetterdao-contracts/*",
      "react-icons/*",
      "@iconscout/react-unicons",
      "iconoir-react",
    ],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  typescript: { ignoreBuildErrors: true },
  swcMinify: true,
  compress: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    })
    return config
  },
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

module.exports = withBundleAnalyzer(nextConfig)
