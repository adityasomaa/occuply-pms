import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The only images the app ships are the brand marks, and they are already
    // exported at their display size. Routing them through the optimizer buys
    // nothing and fails outright when the account has no optimization quota.
    unoptimized: true,
  },
};

export default nextConfig;
