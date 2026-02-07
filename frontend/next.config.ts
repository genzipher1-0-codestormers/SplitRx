
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  typescript: {
    // Skip TypeScript checks during Docker build (run separately in CI/CD)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during Docker build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
