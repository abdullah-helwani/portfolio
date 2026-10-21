import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static resolves its binary relative to its own folder, so it must not be bundled.
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
