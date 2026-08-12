import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // T04: allow multi-photo create requests (10 x 5 MB) in a single server action.
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
};

export default nextConfig;
