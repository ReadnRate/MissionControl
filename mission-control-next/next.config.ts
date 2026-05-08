import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack to this directory so workspace lockfile auto-detection
  // doesn't traverse upward into the parent monorepo workspace.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
