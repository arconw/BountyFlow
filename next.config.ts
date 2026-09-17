import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "32kb" } },
};

export default nextConfig;
