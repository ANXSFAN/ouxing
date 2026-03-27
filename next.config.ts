import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
};

export default nextConfig;
