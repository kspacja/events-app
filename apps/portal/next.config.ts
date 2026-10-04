import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@events/contract", "@events/ui"],
};

export default nextConfig;
