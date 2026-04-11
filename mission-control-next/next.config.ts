import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root detection when multiple lockfiles exist
  turbopack: {
    root: "/data/.openclaw/workspace/mission-control-next",
  },
};

export default nextConfig;
