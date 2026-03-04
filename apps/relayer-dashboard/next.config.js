/** @type {import('next').NextConfig} */

if (typeof self === "undefined") {
  global.self = global
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const nextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  reactStrictMode: true,
  transpilePackages: ["@vechain/vebetterdao-contracts"],
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
