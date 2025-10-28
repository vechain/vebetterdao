/** @type {import('next').NextConfig} */

// Global self polyfill for environments where it's not defined
if (typeof self === "undefined") {
  global.self = global
}

const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "@vechain/dapp-kit-react",
      "@vechain/vechain-kit",
      "@chakra-ui/react",
      "react-icons/bs",
      "react-icons/fa",
      "react-icons/fa6",
      "react-icons/md",
      "react-icons/io",
      "react-icons/io5",
      "react-icons/fi",
      "react-icons/tb",
      "iconoir-react",
      "react-hook-form",
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
  swcMinify: true,
  compress: true,
  serverExternalPackages: ["@vechain/vebetterdao-contracts"],
  transpilePackages: ["express", "ts-node"],
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    })
    return config
  },
  rewrites: () => [{ source: "/storybook", destination: "/storybook/index.html" }],
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

module.exports = withBundleAnalyzer(nextConfig)
