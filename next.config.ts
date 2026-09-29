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
};

export default nextConfig;
