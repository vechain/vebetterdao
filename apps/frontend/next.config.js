/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/contracts"],
  distDir: "dist",
}

module.exports = nextConfig
