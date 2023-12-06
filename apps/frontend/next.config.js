/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/contracts"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      use: "json-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
