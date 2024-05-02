/** @type {import('next').NextConfig} */

const removeImports = require("next-remove-imports")()
module.exports = removeImports({})

const nextConfig = {
  transpilePackages: ["@repo/contracts"],
}

module.exports = nextConfig
