import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@events/catalog", "@events/contract", "@events/time", "@events/ui"],
};

export default nextConfig;
