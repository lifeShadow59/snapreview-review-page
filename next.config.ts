import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for pg-native module not found error
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "pg-native": false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ignore pg-native module completely
    config.externals = config.externals || [];
    config.externals.push("pg-native");

    return config;
  },
};

export default nextConfig;
