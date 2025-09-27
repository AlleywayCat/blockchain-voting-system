/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable experimental features (if needed)
  experimental: {
    // Add experimental features here as needed
  },

  // Webpack configuration for Solana and crypto libraries
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js modules that don't exist in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Handle .mjs files properly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },

  // Environment variables available to the client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Optimize images (if using next/image)
  images: {
    domains: [],
    unoptimized: false,
  },

  // Enable source maps in production for better debugging (optional)
  productionBrowserSourceMaps: false,
};

export default nextConfig;