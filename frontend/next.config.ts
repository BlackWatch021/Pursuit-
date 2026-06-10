import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully client-rendered app (data comes from the separate API), so we ship a
  // static export — deployable as a Render Static Site (never sleeps, free CDN).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
