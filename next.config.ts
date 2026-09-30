import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io", pathname: "/media/**" },
    ],
  },
  outputFileTracingIncludes: {
    "/*": ["./certs/supabase-ca.crt"],
  },
  allowedDevOrigins: ["192.168.1.16"],
};

export default nextConfig;
